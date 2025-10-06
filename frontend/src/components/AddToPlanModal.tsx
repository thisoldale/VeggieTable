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
  const previousTimeToMaturity = usePrevious(watchedTimeToMaturity);
  const previousDaysToTransplant = usePrevious(watchedDaysToTransplant);

  useEffect(() => {
    if (!previousPlantingMethod || previousPlantingMethod === watchedPlantingMethod) return;

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
      time_to_maturity_override: watchedTimeToMaturity,
      days_to_transplant_high: watchedDaysToTransplant,
    };
    const newDates = calculateDates(currentValues, lockedField, watchedPlantingMethod);
    setValue('sowDate', newDates.planned_sow_date || '');
    setValue('transplantDate', newDates.planned_transplant_date || '');
    setValue('harvestDate', newDates.planned_harvest_start_date || '');
  }, [watchedPlantingMethod, previousPlantingMethod, setValue, watchedDates, watchedTimeToMaturity, watchedDaysToTransplant, lockedField]);

  useEffect(() => {
    // This effect handles date recalculation when days to maturity/transplant change.
    if (previousTimeToMaturity === undefined || previousDaysToTransplant === undefined) return;
    if (previousTimeToMaturity === watchedTimeToMaturity && previousDaysToTransplant === watchedDaysToTransplant) return;

    const [sowDate, transplantDate, harvestDate] = watchedDates;
    const currentValues = {
        planned_sow_date: sowDate,
        planned_transplant_date: transplantDate,
        planned_harvest_start_date: harvestDate,
        time_to_maturity_override: watchedTimeToMaturity,
        days_to_transplant_high: watchedDaysToTransplant,
    };

    const newDates = calculateDates(currentValues, lockedField, watchedPlantingMethod);
    if (newDates.planned_sow_date !== sowDate) setValue('sowDate', newDates.planned_sow_date || '');
    if (newDates.planned_transplant_date !== transplantDate) setValue('transplantDate', newDates.planned_transplant_date || '');
    if (newDates.planned_harvest_start_date !== harvestDate) setValue('harvestDate', newDates.planned_harvest_start_date || '');

  }, [watchedTimeToMaturity, watchedDaysToTransplant, previousTimeToMaturity, previousDaysToTransplant, setValue, watchedDates, lockedField, watchedPlantingMethod]);

  const handleDateChange = (field: LockedField, value: string) => {
    setLockedField(field);
    setValue(field === 'planned_sow_date' ? 'sowDate' : field === 'planned_transplant_date' ? 'transplantDate' : 'harvestDate', value);
    const [sowDate, transplantDate, harvestDate] = watchedDates;
    const currentValues = {
        planned_sow_date: field === 'planned_sow_date' ? value : sowDate,
        planned_transplant_date: field === 'planned_transplant_date' ? value : transplantDate,
        planned_harvest_start_date: field === 'planned_harvest_start_date' ? value : harvestDate,
        time_to_maturity_override: watchedTimeToMaturity,
        days_to_transplant_high: watchedDaysToTransplant,
    };
    const newDates = calculateDates(currentValues, field, watchedPlantingMethod);
    if (newDates.planned_sow_date !== sowDate) setValue('sowDate', newDates.planned_sow_date || '');
    if (newDates.planned_transplant_date !== transplantDate) setValue('transplantDate', newDates.planned_transplant_date || '');
    if (newDates.planned_harvest_start_date !== harvestDate) setValue('harvestDate', newDates.planned_harvest_start_date || '');
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

  const FormRow = ({ label, htmlFor, error, children, hasIcon = false }) => (
    <div className="grid grid-cols-[44px,1fr] items-center gap-x-2">
      <div className="col-start-2">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-muted-foreground -mb-1">
          {label}
        </label>
      </div>
      <div className="h-9 w-9 flex items-center justify-center">
        {hasIcon && React.Children.toArray(children)[0]}
      </div>
      <div className="mt-1">
        {hasIcon ? React.Children.toArray(children)[1] : children}
      </div>
      <div className="col-start-2">
        {error && <p className="text-destructive text-xs mt-1">{error.message}</p>}
      </div>
    </div>
  );

  const formFields = {
    plantingMethod: (
      <FormRow label="Planting Method" error={errors.plantingMethod}>
        <select {...register("plantingMethod")} className="block w-full p-2 border border-border bg-component-background rounded-md">
          {Object.values(PlantingMethod).map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </FormRow>
    ),
    quantity: (
      <FormRow label="Quantity" htmlFor="quantity" error={errors.quantity}>
        <input type="number" id="quantity" {...register("quantity", { valueAsNumber: true })} className="block w-full p-2 border border-border bg-component-background rounded-md" min="1" />
      </FormRow>
    ),
    sowDate: (
      <FormRow label="Sow Date" htmlFor="sow-date" error={errors.sowDate} hasIcon={true}>
        <button type="button" onClick={() => setLockedField('planned_sow_date')} className="p-2 rounded-md hover:bg-interactive-hover">
          {lockedField === 'planned_sow_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
        </button>
        <input type="date" id="sow-date" {...register("sowDate")} onChange={(e) => handleDateChange('planned_sow_date', e.target.value)} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    daysToTransplant: (
      <FormRow label="Days to Transplant" htmlFor="days-to-transplant" error={errors.daysToTransplant}>
        <input type="number" id="days-to-transplant" {...register("daysToTransplant")} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    transplantDate: (
      <FormRow label="Transplant Date" htmlFor="transplant-date" error={errors.transplantDate} hasIcon={true}>
        <button type="button" onClick={() => setLockedField('planned_transplant_date')} className="p-2 rounded-md hover:bg-interactive-hover">
          {lockedField === 'planned_transplant_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
        </button>
        <input type="date" id="transplant-date" {...register("transplantDate")} onChange={(e) => handleDateChange('planned_transplant_date', e.target.value)} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    daysToMaturity: (
      <FormRow label="Days to Maturity" htmlFor="time-to-maturity" error={errors.timeToMaturity}>
        <input type="number" id="time-to-maturity" {...register("timeToMaturity")} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    harvestMethod: (
      <FormRow label="Harvest Method" error={errors.harvestMethod}>
        <select {...register("harvestMethod")} className="block w-full p-2 border border-border bg-component-background rounded-md">
          {Object.values(HarvestMethod).map(method => (
            <option key={method} value={method}>{method}</option>
          ))}
        </select>
      </FormRow>
    ),
    harvestDate: (
      <FormRow label={watchedHarvestMethod === HarvestMethod.SINGLE_HARVEST ? 'Harvest Date' : (watchedHarvestMethod === HarvestMethod.STAGGERED ? 'First Harvest' : 'Harvest Start')} htmlFor="harvest-date" error={errors.harvestDate} hasIcon={true}>
        <button type="button" onClick={() => setLockedField('planned_harvest_start_date')} className="p-2 rounded-md hover:bg-interactive-hover">
          {lockedField === 'planned_harvest_start_date' ? <Lock className="h-5 w-5 text-interactive-primary" /> : <Unlock className="h-5 w-5 text-muted-foreground" />}
        </button>
        <input type="date" id="harvest-date" {...register("harvestDate")} onChange={(e) => handleDateChange('planned_harvest_start_date', e.target.value)} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    harvestEndDate: (
      <FormRow label="Harvest End" htmlFor="harvest-end-date" error={errors.harvestEndDate}>
        <input type="date" id="harvest-end-date" {...register("harvestEndDate")} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
    secondHarvestDate: (
      <FormRow label="Second Harvest" htmlFor="second-harvest-date" error={errors.secondHarvestDate}>
        <input type="date" id="second-harvest-date" {...register("secondHarvestDate")} className="block w-full p-2 border border-border bg-component-background rounded-md" />
      </FormRow>
    ),
  };

  const fieldLayouts = {
    [PlantingMethod.DIRECT_SEEDING]: {
      column1: ['plantingMethod', 'quantity', 'sowDate'],
      column2: ['daysToMaturity', 'harvestMethod', 'harvestDate'],
    },
    [PlantingMethod.SEED_STARTING]: {
      column1: ['plantingMethod', 'quantity', 'sowDate', 'daysToTransplant'],
      column2: ['transplantDate', 'daysToMaturity', 'harvestMethod', 'harvestDate'],
    },
    [PlantingMethod.SEEDLING]: {
      column1: ['plantingMethod', 'quantity', 'transplantDate'],
      column2: ['daysToMaturity', 'harvestMethod', 'harvestDate'],
    },
  };

  const currentLayout = fieldLayouts[watchedPlantingMethod] || fieldLayouts[PlantingMethod.DIRECT_SEEDING];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-component-background p-6 rounded-lg shadow-xl w-full max-w-md md:max-w-3xl">
        <h2 className="text-2xl font-bold mb-4">Add "{plant.plant_name}" to {gardenPlan.name}</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-4">
            <div className="flex flex-col space-y-4">
              {currentLayout.column1.map(fieldName => formFields[fieldName])}
            </div>
            <div className="flex flex-col space-y-4">
              {currentLayout.column2.map(fieldName => formFields[fieldName])}
              {(watchedHarvestMethod === HarvestMethod.CONTINUOUS || watchedHarvestMethod === HarvestMethod.CUT_AND_COME_AGAIN) && formFields.harvestEndDate}
              {watchedHarvestMethod === HarvestMethod.STAGGERED && formFields.secondHarvestDate}
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