import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { GardenPlan, Plant, PlantingMethod, PlantingStatus, HarvestMethod } from '../types';
import { useAddPlantingMutation } from '../store/plantApi';
import { format } from 'date-fns';
import { calculateDates } from '../utils/dateCalculations';
import { Lock, Unlock } from 'lucide-react';

type LockedField = 'planned_sow_date' | 'planned_transplant_date' | 'planned_harvest_start_date';

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
  harvestMethod: z.nativeEnum(HarvestMethod),
  sowDate: z.string().optional(),
  transplantDate: z.string().optional(),
  harvestDate: z.string().optional(),
  harvestEndDate: z.string().optional(),
  secondHarvestDate: z.string().optional(),
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
}).refine(data => {
    if (data.harvestDate && data.harvestEndDate) {
        return new Date(data.harvestEndDate) >= new Date(data.harvestDate);
    }
    return true;
}, {
    message: "Harvest end date must be after harvest start date.",
    path: ["harvestEndDate"],
}).refine(data => {
    if (data.harvestDate && data.secondHarvestDate) {
        return new Date(data.secondHarvestDate) >= new Date(data.harvestDate);
    }
    return true;
}, {
    message: "Second harvest date must be after first harvest date.",
    path: ["secondHarvestDate"],
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
  const [lockedField, setLockedField] = useState<LockedField>('planned_sow_date');

  const { register, handleSubmit, watch, setValue, formState: { errors }, reset } = useForm<PlantingFormData>({
    resolver: zodResolver(plantingSchema),
  });

  const watchedDates = watch(['sowDate', 'transplantDate', 'harvestDate']);
  const watchedPlantingMethod = watch('plantingMethod');
  const watchedHarvestMethod = watch('harvestMethod');
  const watchedTimeToMaturity = watch('timeToMaturity');
  const watchedDaysToTransplant = watch('daysToTransplant');
  const previousPlantingMethod = usePrevious(watchedPlantingMethod);

  useEffect(() => {
    if (!previousPlantingMethod || previousPlantingMethod === watchedPlantingMethod) return;

    // Set default lock based on new planting method
    if (watchedPlantingMethod === PlantingMethod.SEEDLING) {
      setLockedField('planned_transplant_date');
    } else {
      setLockedField('planned_sow_date');
    }

    const [sowDate, transplantDate, harvestDate] = watchedDates;

    const currentValues = {
      planned_sow_date: sowDate,
      planned_transplant_date: transplantDate,
      planned_harvest_start_date: harvestDate,
      time_to_maturity: watchedTimeToMaturity,
      days_to_transplant_high: watchedDaysToTransplant,
    };

    const newDates = calculateDates(currentValues, lockedField, watchedPlantingMethod);

    setValue('sowDate', newDates.planned_sow_date || '');
    setValue('transplantDate', newDates.planned_transplant_date || '');
    setValue('harvestDate', newDates.planned_harvest_start_date || '');

  }, [watchedPlantingMethod, previousPlantingMethod, setValue, watchedDates, watchedTimeToMaturity, watchedDaysToTransplant, lockedField]);


  const handleDateChange = (field: LockedField, value: string) => {
    setLockedField(field);
    setValue(field === 'planned_sow_date' ? 'sowDate' : field === 'planned_transplant_date' ? 'transplantDate' : 'harvestDate', value);

    const [sowDate, transplantDate, harvestDate] = watchedDates;
    const currentValues = {
        planned_sow_date: field === 'planned_sow_date' ? value : sowDate,
        planned_transplant_date: field === 'planned_transplant_date' ? value : transplantDate,
        planned_harvest_start_date: field === 'planned_harvest_start_date' ? value : harvestDate,
        time_to_maturity: watchedTimeToMaturity,
        days_to_transplant_high: watchedDaysToTransplant,
    };

    const newDates = calculateDates(currentValues, field, watchedPlantingMethod);

    if (newDates.planned_sow_date !== sowDate) {
        setValue('sowDate', newDates.planned_sow_date || '');
    }
    if (newDates.planned_transplant_date !== transplantDate) {
        setValue('transplantDate', newDates.planned_transplant_date || '');
    }
    if (newDates.planned_harvest_start_date !== harvestDate) {
        setValue('harvestDate', newDates.planned_harvest_start_date || '');
    }
  };

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
        harvestMethod: HarvestMethod.SINGLE_HARVEST,
        timeToMaturity: String(parseDays(plant.time_to_maturity) || ''),
        daysToTransplant: String(parseDays(plant.days_to_transplant_high) || ''),
        sowDate: '',
        transplantDate: '',
        harvestDate: '',
        harvestEndDate: '',
        secondHarvestDate: '',
      };
      
      let anchorField: LockedField = 'planned_sow_date';

      if (initialDate) {
        const dateStr = format(initialDate, 'yyyy-MM-dd');

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

        setLockedField(anchorField);

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

      } else {
        // Set default lock based on planting method when no initial date is provided
        if (defaultPlantingMethod === PlantingMethod.SEEDLING) {
          setLockedField('planned_transplant_date');
        } else {
          setLockedField('planned_sow_date');
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
          harvest_method: data.harvestMethod,
          time_to_maturity_override: parseDays(data.timeToMaturity),
          planned_sow_date: data.sowDate || undefined,
          planned_transplant_date: data.transplantDate || undefined,
          planned_harvest_start_date: data.harvestDate || undefined,
          planned_harvest_end_date: data.harvestEndDate || undefined,
          planned_second_harvest_date: data.secondHarvestDate || undefined,
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
      <div className="bg-component-background p-6 rounded-lg shadow-xl w-full max-w-md md:max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Add "{plant.plant_name}" to {gardenPlan.name}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            {/* Column 1: Planting Details */}
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground ml-11">Planting Method</label>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9"></div> {/* Spacer */}
                  <select {...register("plantingMethod")}
                    className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md">
                    {Object.values(PlantingMethod).map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground">Quantity</label>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9"></div> {/* Spacer */}
                  <input type="number" id="quantity" {...register("quantity", { valueAsNumber: true })}
                    className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md" min="1"
                  />
                </div>
                {errors.quantity && <p className="text-destructive text-xs mt-1 ml-11">{errors.quantity.message}</p>}
              </div>
              <div>
                <label htmlFor="time-to-maturity" className="block text-sm font-medium text-muted-foreground">Days to Maturity</label>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9"></div> {/* Spacer */}
                  <input type="number" id="time-to-maturity" {...register("timeToMaturity")}
                    className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"
                  />
                </div>
                {errors.timeToMaturity && <p className="text-destructive text-xs mt-1 ml-11">{errors.timeToMaturity.message}</p>}
              </div>
              {(watch("plantingMethod") === PlantingMethod.SEED_STARTING) && (
                <div>
                    <label htmlFor="days-to-transplant" className="block text-sm font-medium text-muted-foreground">Days to Transplant</label>
                    <div className="flex items-center space-x-2">
                      <div className="w-9 h-9"></div> {/* Spacer */}
                      <input
                          type="number"
                          id="days-to-transplant"
                          {...register("daysToTransplant")}
                          className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"
                      />
                    </div>
                </div>
              )}
              {(watch("plantingMethod") === PlantingMethod.SEED_STARTING || watch("plantingMethod") === PlantingMethod.DIRECT_SEEDING) && (
                <div>
                  <label htmlFor="sow-date" className="block text-sm font-medium text-muted-foreground ml-11">Sow Date</label>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setLockedField('planned_sow_date')} className="p-2 mt-1 rounded-md hover:bg-interactive-hover">
                        {lockedField === 'planned_sow_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <input type="date" id="sow-date" {...register("sowDate")} onChange={(e) => handleDateChange('planned_sow_date', e.target.value)} className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"/>
                  </div>
                  {errors.sowDate && <p className="text-destructive text-xs mt-1 ml-11">{errors.sowDate.message}</p>}
                </div>
              )}
              {(watch("plantingMethod") === PlantingMethod.SEED_STARTING || watch("plantingMethod") === PlantingMethod.SEEDLING) && (
                <div>
                  <label htmlFor="transplant-date" className="block text-sm font-medium text-muted-foreground ml-11">Transplant Date</label>
                  <div className="flex items-center space-x-2">
                    <button type="button" onClick={() => setLockedField('planned_transplant_date')} className="p-2 mt-1 rounded-md hover:bg-interactive-hover">
                        {lockedField === 'planned_transplant_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                    </button>
                    <input type="date" id="transplant-date" {...register("transplantDate")} onChange={(e) => handleDateChange('planned_transplant_date', e.target.value)} className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"/>
                  </div>
                  {errors.transplantDate && <p className="text-destructive text-xs mt-1 ml-11">{errors.transplantDate.message}</p>}
                </div>
              )}
            </div>

            {/* Column 2: Harvest Details */}
            <div className="flex flex-col space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground ml-11">Harvest Method</label>
                <div className="flex items-center space-x-2">
                  <div className="w-9 h-9"></div> {/* Spacer */}
                  <select {...register("harvestMethod")}
                    className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md">
                    {Object.values(HarvestMethod).map(method => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="harvest-date" className="block text-sm font-medium text-muted-foreground ml-11">
                  {watchedHarvestMethod === HarvestMethod.SINGLE_HARVEST ? 'Harvest Date' :
                   (watchedHarvestMethod === HarvestMethod.STAGGERED ? 'First Harvest' : 'Harvest Start')}
                </label>
                <div className="flex items-center space-x-2">
                  <button type="button" onClick={() => setLockedField('planned_harvest_start_date')} className="p-2 mt-1 rounded-md hover:bg-interactive-hover">
                    {lockedField === 'planned_harvest_start_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
                  </button>
                  <input type="date" id="harvest-date" {...register("harvestDate")} onChange={(e) => handleDateChange('planned_harvest_start_date', e.target.value)} className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"/>
                </div>
                {errors.harvestDate && <p className="text-destructive text-xs mt-1 ml-11">{errors.harvestDate.message}</p>}
              </div>
              {(watchedHarvestMethod === HarvestMethod.CONTINUOUS || watchedHarvestMethod === HarvestMethod.CUT_AND_COME_AGAIN) && (
                <div>
                  <label htmlFor="harvest-end-date" className="block text-sm font-medium text-muted-foreground">Harvest End</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9"></div> {/* Spacer */}
                    <input type="date" id="harvest-end-date" {...register("harvestEndDate")} className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"/>
                  </div>
                  {errors.harvestEndDate && <p className="text-destructive text-xs mt-1 ml-11">{errors.harvestEndDate.message}</p>}
                </div>
              )}
              {watchedHarvestMethod === HarvestMethod.STAGGERED && (
                <div>
                  <label htmlFor="second-harvest-date" className="block text-sm font-medium text-muted-foreground">Second Harvest</label>
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9"></div> {/* Spacer */}
                    <input type="date" id="second-harvest-date" {...register("secondHarvestDate")} className="mt-1 block w-full p-2 border border-border bg-component-background rounded-md"/>
                  </div>
                  {errors.secondHarvestDate && <p className="text-destructive text-xs mt-1 ml-11">{errors.secondHarvestDate.message}</p>}
                </div>
              )}
            </div>
          </div>

          {(!watchedTimeToMaturity || watchedTimeToMaturity === '0') &&
            <p className="text-xs text-amber-500 mt-1">
              Enter Days to Maturity to enable automatic date calculation.
            </p>
          }

          <div className="flex justify-end space-x-2 mt-6">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-interactive-secondary text-interactive-secondary-foreground rounded-md">Cancel</button>
            <button type="submit" disabled={isAddingPlanting} className="px-4 py-2 bg-interactive-primary text-interactive-primary-foreground rounded-md disabled:opacity-50">
              {isAddingPlanting ? 'Adding...' : 'Add to Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default AddToPlanModal;
