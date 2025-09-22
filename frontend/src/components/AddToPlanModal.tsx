import React, { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GardenPlan, Plant, PlantingMethod, PlantingStatus } from '../types';
import { useAddPlantingMutation } from '../store/plantApi';
import { format } from 'date-fns';
import { calculateDates } from '../utils/dateCalculations';

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => {
    ref.current = value;
  });
  return ref.current;
}

const plantingSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  plantingMethod: z.nativeEnum(PlantingMethod),
  sowDate: z.string().optional(),
  transplantDate: z.string().optional(),
  harvestDate: z.string().optional(),
  timeToMaturity: z.string().regex(/^\d*$/, "Must be a number").optional(),
  daysToTransplant: z.string().regex(/^\d*$/, "Must be a number").optional(),
}).refine(data => {
    if (data.sowDate && data.transplantDate) {
        return new Date(data.transplantDate) >= new Date(data.sowDate);
    }
    return true;
}, {
    message: "Transplant date must be after sow date.",
    path: ["transplantDate"],
}).refine(data => {
    if (data.transplantDate && data.harvestDate) {
        return new Date(data.harvestDate) >= new Date(data.transplantDate);
    }
    return true;
}, {
    message: "Harvest date must be after transplant date.",
    path: ["harvestDate"],
});

type PlantingFormData = z.infer<typeof plantingSchema>;

interface AddToPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  plant: Plant;
  gardenPlan: GardenPlan;
  onPlantingAdd: () => void;
  initialDate?: Date | null;
  initialAction?: PlantingMethod | 'harvest' | null;
}

const AddToPlanModal: React.FC<AddToPlanModalProps> = ({ isOpen, onClose, plant, gardenPlan, onPlantingAdd, initialDate, initialAction }) => {
  const [addPlanting, { isLoading: isAddingPlanting }] = useAddPlantingMutation();

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<PlantingFormData>({
    resolver: zodResolver(plantingSchema),
  });
  const lastChangedField = useRef<string | null>(null);

  const watchedDates = watch(['sowDate', 'transplantDate', 'harvestDate']);
  const watchedPlantingMethod = watch('plantingMethod');
  const watchedTimeToMaturity = watch('timeToMaturity');
  const previousPlantingMethod = usePrevious(watchedPlantingMethod);

  useEffect(() => {
    if (!lastChangedField.current) return;

    const currentValues = {
        planned_sow_date: watchedDates[0],
        planned_transplant_date: watchedDates[1],
        planned_harvest_start_date: watchedDates[2],
        time_to_maturity: watch('timeToMaturity'),
        days_to_transplant_high: watch('daysToTransplant'),
    };

    const newDates = calculateDates(currentValues, lastChangedField.current, watchedPlantingMethod);

    if (newDates.planned_sow_date !== watchedDates[0]) {
        setValue('sowDate', newDates.planned_sow_date || '');
    }
    if (newDates.planned_transplant_date !== watchedDates[1]) {
        setValue('transplantDate', newDates.planned_transplant_date || '');
    }
    if (newDates.planned_harvest_start_date !== watchedDates[2]) {
        setValue('harvestDate', newDates.planned_harvest_start_date || '');
    }
  }, [watchedDates, setValue, watch, watchedPlantingMethod]);
  
  useEffect(() => {
    if (previousPlantingMethod && previousPlantingMethod !== watchedPlantingMethod) {
      setValue('sowDate', '');
      setValue('transplantDate', '');
      setValue('harvestDate', '');
    }
  }, [watchedPlantingMethod, previousPlantingMethod, setValue]);

  const parseDays = (timeValue: string | number | null | undefined): number | null => {
      if (timeValue === null || timeValue === undefined) return null;
      if (typeof timeValue === 'number') return timeValue;
      const match = String(timeValue).match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
  };

  useEffect(() => {
    if (isOpen && plant) {
      let defaultPlantingMethod = PlantingMethod.SEED_STARTING;
      if (initialAction && initialAction !== 'harvest') {
        defaultPlantingMethod = initialAction;
      }

      const defaults: Partial<PlantingFormData> = {
        quantity: 1,
        plantingMethod: defaultPlantingMethod,
        timeToMaturity: String(parseDays(plant.time_to_maturity) || ''),
        daysToTransplant: String(parseDays(plant.days_to_transplant_high) || ''),
        sowDate: '',
        transplantDate: '',
        harvestDate: '',
      };
      
      if (initialDate) {
        const dateStr = format(initialDate, 'yyyy-MM-dd');
        let anchorField: string | null = null;

        if (initialAction === 'harvest') {
            defaults.harvestDate = dateStr;
            anchorField = 'planned_harvest_start_date';
        } else if (defaultPlantingMethod === PlantingMethod.SEEDLING) {
            defaults.transplantDate = dateStr;
            anchorField = 'planned_transplant_date';
        } else {
            defaults.sowDate = dateStr;
            anchorField = 'planned_sow_date';
        }

        if (anchorField) {
            const currentValues = {
                planned_sow_date: defaults.sowDate,
                planned_transplant_date: defaults.transplantDate,
                planned_harvest_start_date: defaults.harvestDate,
                time_to_maturity: defaults.timeToMaturity,
                days_to_transplant_high: defaults.daysToTransplant,
            };
            const newDates = calculateDates(currentValues, anchorField, defaultPlantingMethod);

            if(newDates.planned_sow_date) defaults.sowDate = newDates.planned_sow_date;
            if(newDates.planned_transplant_date) defaults.transplantDate = newDates.planned_transplant_date;
            if(newDates.planned_harvest_start_date) defaults.harvestDate = newDates.planned_harvest_start_date;
        }
      }

      reset(defaults);
    }
  }, [isOpen, plant, reset, initialDate, initialAction]);


  const onSubmit = async (data: PlantingFormData) => {
    try {
      await addPlanting({
        planId: gardenPlan.id,
        payload: {
          library_plant_id: plant.id,
          quantity: data.quantity,
          planting_method: data.plantingMethod,
          time_to_maturity_override: parseDays(data.timeToMaturity),
          planned_sow_date: data.sowDate || undefined,
          planned_transplant_date: data.transplantDate || undefined,
          planned_harvest_start_date: data.harvestDate || undefined,
          status: PlantingStatus.PLANNED,
        }
      }).unwrap();
      
      onPlantingAdd();
    } catch (err) {
      console.error('Failed to add planting:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add "{plant.plant_name}" to {gardenPlan.name}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Planting Method</label>
            <select {...register("plantingMethod")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
              {Object.values(PlantingMethod).map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
            <input type="number" id="quantity" {...register("quantity", { valueAsNumber: true })}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md" min="1"
            />
            {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="time-to-maturity" className="block text-sm font-medium text-gray-700">Days to Maturity</label>
            <input type="number" id="time-to-maturity" {...register("timeToMaturity")}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            />
            {errors.timeToMaturity && <p className="text-red-500 text-xs mt-1">{errors.timeToMaturity.message}</p>}
          </div>

          {(watch("plantingMethod") === PlantingMethod.SEED_STARTING) && (
             <div className="mb-4">
                <label htmlFor="days-to-transplant" className="block text-sm font-medium text-gray-700">Days to Transplant</label>
                <input 
                    type="number" 
                    id="days-to-transplant" 
                    {...register("daysToTransplant")}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
             </div>
          )}

          {(watch("plantingMethod") === PlantingMethod.SEED_STARTING || watch("plantingMethod") === PlantingMethod.DIRECT_SEEDING) && (
             <div className="mb-4">
                <label htmlFor="sow-date" className="block text-sm font-medium text-gray-700">Sow Date</label>
                <input type="date" id="sow-date" {...register("sowDate")} onChange={(e) => { setValue('sowDate', e.target.value); lastChangedField.current = 'planned_sow_date'; }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                {errors.sowDate && <p className="text-red-500 text-xs mt-1">{errors.sowDate.message}</p>}
             </div>
          )}

          {(watch("plantingMethod") === PlantingMethod.SEED_STARTING || watch("plantingMethod") === PlantingMethod.SEEDLING) && (
            <div className="mb-4">
                <label htmlFor="transplant-date" className="block text-sm font-medium text-gray-700">Transplant Date</label>
                <input type="date" id="transplant-date" {...register("transplantDate")} onChange={(e) => { setValue('transplantDate', e.target.value); lastChangedField.current = 'planned_transplant_date'; }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
                {errors.transplantDate && <p className="text-red-500 text-xs mt-1">{errors.transplantDate.message}</p>}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="harvest-date" className="block text-sm font-medium text-gray-700">Target Harvest Date</label>
            <input type="date" id="harvest-date" {...register("harvestDate")} onChange={(e) => { setValue('harvestDate', e.target.value); lastChangedField.current = 'planned_harvest_start_date'; }} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            {errors.harvestDate && <p className="text-red-500 text-xs mt-1">{errors.harvestDate.message}</p>}
            <p className="text-xs text-gray-500 mt-1">Enter any known dates. The related tasks will be created automatically.</p>
            {(!watchedTimeToMaturity || watchedTimeToMaturity === '0') &&
              <p className="text-xs text-orange-500 mt-1">
                Enter Days to Maturity to enable automatic date calculation.
              </p>
            }
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded-md">Cancel</button>
            <button type="submit" disabled={isAddingPlanting} className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50">
              {isAddingPlanting ? 'Adding...' : 'Add to Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToPlanModal;
