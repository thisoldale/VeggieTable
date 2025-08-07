import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GardenPlan, Plant, PlantingMethod, PlantingStatus } from '../types';
import { useAddPlantingMutation } from '../store/plantApi';
import { format } from 'date-fns';

const plantingSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  plantingMethod: z.nativeEnum(PlantingMethod),
  sowDate: z.string().optional(),
  transplantDate: z.string().optional(),
  harvestDate: z.string().optional(),
  timeToMaturity: z.string().regex(/^\d*$/, "Must be a number").optional(),
  daysToTransplant: z.string().regex(/^\d*$/, "Must be a number").optional(),
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
  
  const parseDays = (timeValue: string | number | null | undefined): number | null => {
      if (timeValue === null || timeValue === undefined) return null;
      if (typeof timeValue === 'number') return timeValue;
      const match = String(timeValue).match(/\d+/);
      return match ? parseInt(match[0], 10) : null;
  };

  const addDays = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setDate(date.getDate() + days);
    return format(date, 'yyyy-MM-dd');
  };

  const subtractDays = (dateStr: string, days: number): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr + 'T00:00:00Z');
    date.setDate(date.getDate() - days);
    return format(date, 'yyyy-MM-dd');
  };

  const handleSowDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSowDate = e.target.value;
    setValue("sowDate", newSowDate, { shouldValidate: true });

    const daysToMaturity = parseDays(watch("timeToMaturity"));
    if (!daysToMaturity || !newSowDate) return;

    if (watch("plantingMethod") === PlantingMethod.DIRECT_SEEDING) {
      setValue('harvestDate', addDays(newSowDate, daysToMaturity));
    } else if (watch("plantingMethod") === PlantingMethod.SEED_STARTING) {
      const daysToTransplant = parseDays(watch("daysToTransplant"));
      if (daysToTransplant) {
        const calculatedTransplantDate = addDays(newSowDate, daysToTransplant);
        setValue('transplantDate', calculatedTransplantDate);
        setValue('harvestDate', addDays(calculatedTransplantDate, daysToMaturity));
      }
    }
  };

  const handleTransplantDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTransplantDate = e.target.value;
    setValue("transplantDate", newTransplantDate, { shouldValidate: true });

    const daysToMaturity = parseDays(watch("timeToMaturity"));
    if (!daysToMaturity || !newTransplantDate) return;

    if (watch("plantingMethod") === PlantingMethod.SEEDLING) {
      setValue('harvestDate', addDays(newTransplantDate, daysToMaturity));
    }
  };

  const handleHarvestDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHarvestDate = e.target.value;
    setValue("harvestDate", newHarvestDate, { shouldValidate: true });

    const daysToMaturity = parseDays(watch("timeToMaturity"));
    if (!daysToMaturity || !newHarvestDate) return;

    const baseDate = subtractDays(newHarvestDate, daysToMaturity);

    if (watch("plantingMethod") === PlantingMethod.DIRECT_SEEDING) {
      setValue('sowDate', baseDate);
      setValue('transplantDate', '');
    } else if (watch("plantingMethod") === PlantingMethod.SEEDLING) {
      setValue('transplantDate', baseDate);
      setValue('sowDate', '');
    } else if (watch("plantingMethod") === PlantingMethod.SEED_STARTING) {
      const daysToTransplant = parseDays(watch("daysToTransplant"));
      if (daysToTransplant) {
        setValue('transplantDate', baseDate);
        setValue('sowDate', subtractDays(baseDate, daysToTransplant));
      }
    }
  };

  const handleDaysToTransplantChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDays = e.target.value;
    setValue("daysToTransplant", newDays, { shouldValidate: true });

    const sowDate = watch("sowDate");
    if (watch("plantingMethod") === PlantingMethod.SEED_STARTING && sowDate) {
        const daysToMaturity = parseDays(watch("timeToMaturity"));
        const daysToTransplant = parseDays(newDays);

        if (daysToTransplant) {
            const calculatedTransplantDate = addDays(sowDate, daysToTransplant);
            setValue('transplantDate', calculatedTransplantDate);
            if (daysToMaturity) {
                setValue('harvestDate', addDays(calculatedTransplantDate, daysToMaturity));
            }
        }
    }
  };

  const handlePlantingMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMethod = e.target.value as PlantingMethod;
    setValue("plantingMethod", newMethod, { shouldValidate: true });

    const sowDate = watch("sowDate");
    const harvestDate = watch("harvestDate");
    const daysToMaturity = parseDays(watch("timeToMaturity"));
    const daysToTransplant = parseDays(watch("daysToTransplant"));

    if (newMethod === PlantingMethod.DIRECT_SEEDING) {
        setValue("transplantDate", "");
    } else if (newMethod === PlantingMethod.SEEDLING) {
        setValue("sowDate", "");
    }

    if (daysToMaturity && sowDate) {
        if (newMethod === PlantingMethod.DIRECT_SEEDING) {
            setValue('harvestDate', addDays(sowDate, daysToMaturity));
        } else if (newMethod === PlantingMethod.SEED_STARTING && daysToTransplant) {
            const calculatedTransplantDate = addDays(sowDate, daysToTransplant);
            setValue('transplantDate', calculatedTransplantDate);
            setValue('harvestDate', addDays(calculatedTransplantDate, daysToMaturity));
        }
    } else if (daysToMaturity && harvestDate) {
        const baseDate = subtractDays(harvestDate, daysToMaturity);
        if (newMethod === PlantingMethod.DIRECT_SEEDING) {
            setValue('sowDate', baseDate);
        } else if (newMethod === PlantingMethod.SEEDLING) {
            setValue('transplantDate', baseDate);
        } else if (newMethod === PlantingMethod.SEED_STARTING && daysToTransplant) {
            setValue('transplantDate', baseDate);
            setValue('sowDate', subtractDays(baseDate, daysToTransplant));
        }
    }
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
        if (initialAction === 'harvest') {
            defaults.harvestDate = dateStr;
        } else if (defaultPlantingMethod === PlantingMethod.SEEDLING) {
            defaults.transplantDate = dateStr;
        } else {
            defaults.sowDate = dateStr;
        }
      }

      const daysToMaturity = parseDays(defaults.timeToMaturity);
      const daysToTransplant = parseDays(defaults.daysToTransplant);

      if (daysToMaturity) {
        if (defaults.sowDate) {
          if (defaults.plantingMethod === PlantingMethod.DIRECT_SEEDING) {
            defaults.harvestDate = addDays(defaults.sowDate, daysToMaturity);
          } else if (defaults.plantingMethod === PlantingMethod.SEED_STARTING && daysToTransplant) {
            const calculatedTransplantDate = addDays(defaults.sowDate, daysToTransplant);
            defaults.transplantDate = calculatedTransplantDate;
            defaults.harvestDate = addDays(calculatedTransplantDate, daysToMaturity);
          }
        } else if (defaults.transplantDate) {
           if (defaults.plantingMethod === PlantingMethod.SEEDLING) {
             defaults.harvestDate = addDays(defaults.transplantDate, daysToMaturity);
           }
        } else if (defaults.harvestDate) {
            const baseDate = subtractDays(defaults.harvestDate, daysToMaturity);
            if (defaults.plantingMethod === PlantingMethod.DIRECT_SEEDING) {
              defaults.sowDate = baseDate;
            } else if (defaults.plantingMethod === PlantingMethod.SEEDLING) {
              defaults.transplantDate = baseDate;
            } else if (defaults.plantingMethod === PlantingMethod.SEED_STARTING && daysToTransplant) {
              defaults.transplantDate = baseDate;
              defaults.sowDate = subtractDays(baseDate, daysToTransplant);
            }
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
              onChange={handlePlantingMethodChange}
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
                    onChange={handleDaysToTransplantChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                />
             </div>
          )}

          {(watch("plantingMethod") === PlantingMethod.SEED_STARTING || watch("plantingMethod") === PlantingMethod.DIRECT_SEEDING) && (
             <div className="mb-4">
                <label htmlFor="sow-date" className="block text-sm font-medium text-gray-700">Sow Date</label>
                <input type="date" id="sow-date" {...register("sowDate")} onChange={handleSowDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
             </div>
          )}

          {watch("plantingMethod") === PlantingMethod.SEEDLING && (
            <div className="mb-4">
                <label htmlFor="transplant-date" className="block text-sm font-medium text-gray-700">Transplant Date</label>
                <input type="date" id="transplant-date" {...register("transplantDate")} onChange={handleTransplantDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            </div>
          )}
          
          {watch("plantingMethod") === PlantingMethod.SEED_STARTING && (
            <div className="mb-4">
                <label htmlFor="transplant-date-calculated" className="block text-sm font-medium text-gray-700">Calculated Transplant Date</label>
                <input type="date" id="transplant-date-calculated" {...register("transplantDate")} readOnly className="mt-1 block w-full p-2 border border-gray-200 rounded-md bg-gray-100"/>
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="harvest-date" className="block text-sm font-medium text-gray-700">Target Harvest Date</label>
            <input type="date" id="harvest-date" {...register("harvestDate")} onChange={handleHarvestDateChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md"/>
            <p className="text-xs text-gray-500 mt-1">Change this to automatically calculate the planting dates.</p>
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
