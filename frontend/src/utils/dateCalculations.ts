import { Planting, PlantingMethod } from '../types';
import { add, sub } from 'date-fns';

const parseDays = (days: string | number | null | undefined): number | null => {
    if (days === null || days === undefined) return null;
    if (typeof days === 'number') {
        return days;
    }
    if (typeof days === 'string') {
        if (days.trim() === '') return null;
        if (days.includes('-')) {
            const parts = days.split('-').map(d => parseInt(d.trim(), 10));
            if (parts.length !== 2 || parts.some(isNaN)) return null;
            return Math.round((parts[0] + parts[1]) / 2);
        }
        const num = parseInt(days, 10);
        return isNaN(num) ? null : num;
    }
    return null;
};

export const calculateDates = (
    planting: Partial<Planting>,
    changedField: string,
    plantingMethod?: PlantingMethod
): { planned_sow_date?: string; planned_transplant_date?: string; planned_harvest_start_date?: string } => {
    const timeToMaturity = parseDays(planting.time_to_maturity_override ?? planting.time_to_maturity);
    const daysToTransplant = parseDays(planting.days_to_transplant_high);

    if (timeToMaturity === null) return {};

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
