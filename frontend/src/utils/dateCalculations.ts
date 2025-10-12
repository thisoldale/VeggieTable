import { Planting, PlantingMethod, DaysSchema } from '../schemas';
import { z } from 'zod';
import { add, sub } from 'date-fns';

const DateCalculationInputSchema = z.object({
    planting: z.object({
        time_to_maturity_override: DaysSchema.optional(),
        time_to_maturity: DaysSchema.optional(),
        days_to_transplant_high: DaysSchema.optional(),
        planned_sow_date: z.string().optional(),
        planned_transplant_date: z.string().optional(),
        planned_harvest_start_date: z.string().optional(),
    }),
    changedField: z.string(),
    plantingMethod: z.nativeEnum(PlantingMethod).optional(),
});


export const calculateDates = (
    planting: Partial<Planting>,
    changedField: string,
    plantingMethod?: PlantingMethod
): { planned_sow_date?: string; planned_transplant_date?: string; planned_harvest_start_date?: string } => {

    const validationResult = DateCalculationInputSchema.safeParse({ planting, changedField, plantingMethod });
    if (!validationResult.success) {
        console.error("Invalid input for calculateDates:", validationResult.error);
        return {};
    }

    const { planting: validatedPlanting } = validationResult.data;

    const timeToMaturity = validatedPlanting.time_to_maturity_override ?? validatedPlanting.time_to_maturity;
    const daysToTransplant = validatedPlanting.days_to_transplant_high;

    if (timeToMaturity === null || timeToMaturity === undefined) return {};

    let sowDate: Date | undefined;
    let transplantDate: Date | undefined;
    let harvestDate: Date | undefined;

    if (changedField === 'planned_sow_date' && planting.planned_sow_date) {
        sowDate = new Date(planting.planned_sow_date);
    } else if (changedField === 'planned_transplant_date' && planting.planned_transplant_date) {
        transplantDate = new Date(planting.planned_transplant_date);
    } else if (changedField === 'planned_harvest_start_date' && planting.planned_harvest_start_date) {
        harvestDate = new Date(planting.planned_harvest_start_date);
    } else {
        return {}; // No valid anchor
    }

    if (sowDate && !isNaN(sowDate.getTime())) {
        if (plantingMethod === PlantingMethod.DIRECT_SEEDING) {
            harvestDate = add(sowDate, { days: timeToMaturity });
        } else if (plantingMethod === PlantingMethod.SEED_STARTING && daysToTransplant !== null) {
            transplantDate = add(sowDate, { days: daysToTransplant });
            harvestDate = add(transplantDate, { days: timeToMaturity });
        }
    } else if (transplantDate && !isNaN(transplantDate.getTime())) {
        if (plantingMethod === PlantingMethod.SEED_STARTING || plantingMethod === PlantingMethod.SEEDLING) {
            harvestDate = add(transplantDate, { days: timeToMaturity });
            if (plantingMethod === PlantingMethod.SEED_STARTING && daysToTransplant !== null) {
                sowDate = sub(transplantDate, { days: daysToTransplant });
            }
        }
    } else if (harvestDate && !isNaN(harvestDate.getTime())) {
        if (plantingMethod === PlantingMethod.DIRECT_SEEDING) {
            sowDate = sub(harvestDate, { days: timeToMaturity });
        } else if (plantingMethod === PlantingMethod.SEED_STARTING || plantingMethod === PlantingMethod.SEEDLING) {
            transplantDate = sub(harvestDate, { days: timeToMaturity });
            if (plantingMethod === PlantingMethod.SEED_STARTING && daysToTransplant !== null) {
                sowDate = sub(transplantDate, { days: daysToTransplant });
            }
        }
    }

    return {
        planned_sow_date: sowDate?.toISOString().split('T')[0],
        planned_transplant_date: transplantDate?.toISOString().split('T')[0],
        planned_harvest_start_date: harvestDate?.toISOString().split('T')[0],
    };
};
