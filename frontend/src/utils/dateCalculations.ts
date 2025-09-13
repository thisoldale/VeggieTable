import { Planting } from '../types';
import { add, sub } from 'date-fns';

const parseDays = (days: string | number | null | undefined): number => {
    if (typeof days === 'number') {
        return days;
    }
    if (typeof days === 'string') {
        if (days.includes('-')) {
            const [min, max] = days.split('-').map(d => parseInt(d.trim(), 10));
            return Math.round((min + max) / 2);
        }
        return parseInt(days, 10);
    }
    return 0;
};

export const calculateDates = (planting: Partial<Planting>, changedField: string): Partial<Planting> => {
    const newPlanting = { ...planting };

    const timeToMaturity = parseDays(newPlanting.time_to_maturity_override ?? newPlanting.time_to_maturity);
    const daysToTransplant = parseDays(newPlanting.days_to_transplant_high);

    switch (changedField) {
        case 'planned_harvest_start_date':
            if (newPlanting.planned_harvest_start_date) {
                const harvestDate = new Date(newPlanting.planned_harvest_start_date);
                if (!isNaN(harvestDate.getTime())) {
                    const transplantDate = sub(harvestDate, { days: timeToMaturity });
                    newPlanting.planned_transplant_date = transplantDate.toISOString().split('T')[0];

                    const sowDate = sub(transplantDate, { days: daysToTransplant });
                    newPlanting.planned_sow_date = sowDate.toISOString().split('T')[0];
                }
            }
            break;

        case 'planned_transplant_date':
            if (newPlanting.planned_transplant_date) {
                const transplantDate = new Date(newPlanting.planned_transplant_date);
                 if (!isNaN(transplantDate.getTime())) {
                    const harvestDate = add(transplantDate, { days: timeToMaturity });
                    newPlanting.planned_harvest_start_date = harvestDate.toISOString().split('T')[0];

                    const sowDate = sub(transplantDate, { days: daysToTransplant });
                    newPlanting.planned_sow_date = sowDate.toISOString().split('T')[0];
                }
            }
            break;

        case 'planned_sow_date':
            if (newPlanting.planned_sow_date) {
                const sowDate = new Date(newPlanting.planned_sow_date);
                if (!isNaN(sowDate.getTime())) {
                    const transplantDate = add(sowDate, { days: daysToTransplant });
                    newPlanting.planned_transplant_date = transplantDate.toISOString().split('T')[0];

                    const harvestDate = add(transplantDate, { days: timeToMaturity });
                    newPlanting.planned_harvest_start_date = harvestDate.toISOString().split('T')[0];
                }
            }
            break;

        default:
            break;
    }

    return newPlanting;
};
