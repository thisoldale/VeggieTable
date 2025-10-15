// frontend/src/schemas.ts
import { z } from 'zod';

// Enums
export const PlantingStatusSchema = z.enum([
  "Planned",
  "Started",
  "Transplanted",
  "Direct Sown",
  "Growing",
  "Harvesting",
  "Done",
]);

export const PlantingMethodSchema = z.enum([
  "Seed Starting",
  "Direct Seeding",
  "Seedling",
]);

export const HarvestMethodSchema = z.enum([
  "Single Harvest",
  "Cut and Come Again",
  "Staggered",
  "Continuous",
]);

export const LogActionTypeSchema = z.enum([
  "Sow Seeds",
  "Transplant",
  "First Harvest",
]);

export const TaskStatusSchema = z.enum([
  "Pending",
  "In Progress",
  "Completed",
]);

// Schemas
export const PlantSchema = z.object({
  id: z.number(),
  plant_name: z.string(),
  variety_name: z.string().nullable().optional(),
  scientific_name: z.string().nullable().optional(),
  plant_family: z.string().nullable().optional(),
  plant_type: z.string().nullable().optional(),
  growth_habit: z.string().nullable().optional(),
  origin_heirloom_status: z.string().nullable().optional(),
  organic: z.boolean().nullable().optional(),
  seed_company_source: z.string().nullable().optional(),
  year_acquired: z.number().nullable().optional(),
  seed_size: z.string().nullable().optional(),
  seed_longevity_storage_life: z.string().nullable().optional(),
  germination_temperature_min: z.number().nullable().optional(),
  germination_temperature_max: z.number().nullable().optional(),
  germination_temperature_ideal: z.number().nullable().optional(),
  germination_time_days: z.string().nullable().optional(),
  light_requirement_for_germination: z.string().nullable().optional(),
  stratification_required: z.boolean().nullable().optional(),
  scarification_required: z.boolean().nullable().optional(),
  sowing_depth: z.string().nullable().optional(),
  spacing_in_row: z.string().nullable().optional(),
  spacing_low: z.number().nullable().optional(),
  spacing_high: z.number().nullable().optional(),
  direct_seedable: z.boolean().nullable().optional(),
  transplantable: z.boolean().nullable().optional(),
  days_to_transplant_low: z.number().nullable().optional(),
  days_to_transplant_high: z.number().nullable().optional(),
  time_to_maturity: z.string().nullable().optional(),
  mature_plant_height: z.string().nullable().optional(),
  mature_plant_spread_width: z.string().nullable().optional(),
  sunlight_requirement: z.string().nullable().optional(),
  water_needs: z.string().nullable().optional(),
  fertilizer_needs: z.string().nullable().optional(),
  pest_resistance: z.string().nullable().optional(),
  disease_resistance: z.string().nullable().optional(),
  cold_hardiness_frost_tolerance: z.string().nullable().optional(),
  heat_tolerance: z.string().nullable().optional(),
  drought_tolerance: z.string().nullable().optional(),
  bolting_tendency: z.string().nullable().optional(),
  support_required: z.string().nullable().optional(),
  pruning_required: z.string().nullable().optional(),
  harvest_window_low: z.number().nullable().optional(),
  harvest_window_high: z.number().nullable().optional(),
  typical_yield: z.string().nullable().optional(),
  yield_units: z.string().nullable().optional(),
  storage_life_post_harvest: z.string().nullable().optional(),
  requires_pollinator: z.boolean().nullable().optional(),
  notes_observations: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  weekly_yield: z.string().nullable().optional(),
});

export const TaskSchema = z.object({
  id: z.number(),
  garden_plan_id: z.number(),
  planting_id: z.number().nullable().optional(),
  task_group_id: z.number().nullable().optional(),
  recurring_task_id: z.number().nullable().optional(),
  name: z.string(),
  description: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
  status: TaskStatusSchema,
});

export const RecurringTaskSchema = z.object({
  id: z.number(),
  garden_plan_id: z.number(),
  planting_id: z.number().optional(),
  name: z.string(),
  description: z.string().optional(),
  recurrence_rule: z.string(),
  recurrence_end_date: z.string().optional(),
  exdates: z.array(z.string()).optional(),
  tasks: z.array(TaskSchema),
});

export const PlantingSchema = PlantSchema.extend({
  quantity: z.number(),
  status: PlantingStatusSchema,
  library_plant_id: z.number(),
  planned_sow_date: z.string().nullable().optional(),
  planned_transplant_date: z.string().nullable().optional(),
  planned_harvest_start_date: z.string().nullable().optional(),
  planned_harvest_end_date: z.string().nullable().optional(),
  planned_second_harvest_date: z.string().nullable().optional(),
  time_to_maturity_override: z.number().nullable().optional(),
  planting_method: PlantingMethodSchema.nullable().optional(),
  harvest_method: HarvestMethodSchema.nullable().optional(),
  tasks: z.array(TaskSchema),
  recurring_tasks: z.array(RecurringTaskSchema),
});

export const PlantingCreatePayloadSchema = z.object({
  library_plant_id: z.number(),
  quantity: z.number(),
  status: PlantingStatusSchema,
  planting_method: PlantingMethodSchema.nullable().optional(),
  harvest_method: HarvestMethodSchema.nullable().optional(),
  time_to_maturity_override: z.number().nullable().optional(),
  planned_sow_date: z.string().optional(),
  planned_transplant_date: z.string().optional(),
  planned_harvest_start_date: z.string().optional(),
  planned_harvest_end_date: z.string().optional(),
  planned_second_harvest_date: z.string().optional(),
});

export const GardenPlanSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable().optional(),
  created_date: z.string(),
  last_accessed_date: z.string(),
  plantings: z.array(PlantingSchema),
  tasks: z.array(TaskSchema),
  recurring_tasks: z.array(RecurringTaskSchema),
});

export const LoginCredentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export const RegistrationDataSchema = z.object({
  username: z.string(),
  email: z.string().email(),
  password: z.string(),
});

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
});

// Create inferred types from schemas
export type Plant = z.infer<typeof PlantSchema>;
export type PlantingStatus = z.infer<typeof PlantingStatusSchema>;
export type PlantingMethod = z.infer<typeof PlantingMethodSchema>;
export type HarvestMethod = z.infer<typeof HarvestMethodSchema>;
export type LogActionType = z.infer<typeof LogActionTypeSchema>;
export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type RecurringTask = z.infer<typeof RecurringTaskSchema>;
export type Planting = z.infer<typeof PlantingSchema>;
export type PlantingCreatePayload = z.infer<typeof PlantingCreatePayloadSchema>;
export type GardenPlan = z.infer<typeof GardenPlanSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RegistrationData = z.infer<typeof RegistrationDataSchema>;
export type User = z.infer<typeof UserSchema>;

// Schema for the form in AddToPlanModal
export const PlantingFormSchema = z.object({
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  plantingMethod: PlantingMethodSchema,
  harvestMethod: HarvestMethodSchema,
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

export type PlantingFormData = z.infer<typeof PlantingFormSchema>;

// Schema for the RecurrenceEditor component state
export const RecurrenceOptionsSchema = z.object({
  freq: z.number(),
  interval: z.number().min(1),
  byday: z.any().nullable(),
  bymonthday: z.number().nullable(),
  bysetpos: z.number().nullable(),
  bymonth: z.number().nullable(),
  count: z.number().nullable(),
  until: z.date().nullable(),
  endType: z.enum(['never', 'date', 'count']),
  dailyOption: z.enum(['everyday', 'weekdays']),
  monthlyOption: z.enum(['day_of_month', 'day_of_week']),
}).refine(data => {
    // Add complex validation logic here as needed.
    // For example, ensure byday is set for weekly recurrences.
    if (data.freq === 2 && (!data.byday || data.byday.length === 0)) { // RRule.WEEKLY = 2
        return false;
    }
    return true;
}, {
    message: "For weekly recurrences, at least one day must be selected.",
    path: ["byday"],
});

export type RecurrenceOptions = z.infer<typeof RecurrenceOptionsSchema>;

// Schema for CSV export
export const CsvExportSchema = z.array(z.object({
    library_plant_id: z.number(),
    plant_name: z.string(),
    variety_name: z.string().nullable().transform(v => v || ''),
    quantity: z.number(),
    status: PlantingStatusSchema,
    planting_method: PlantingMethodSchema.nullable().transform(v => v || ''),
    planned_sow_date: z.string().nullable().transform(v => v || ''),
    planned_transplant_date: z.string().nullable().transform(v => v || ''),
    planned_harvest_start_date: z.string().nullable().transform(v => v || ''),
    time_to_maturity_override: z.number().nullable().transform(v => v || ''),
}));

// Schema for parsing days which can be a number, a string, or a range string '10-14'
export const DaysSchema = z.preprocess((val) => {
    if (typeof val === 'string') {
        if (val.trim() === '') return null;
        if (val.includes('-')) {
            const parts = val.split('-').map(d => parseInt(d.trim(), 10));
            if (parts.length === 2 && !parts.some(isNaN)) {
                return Math.round((parts[0] + parts[1]) / 2);
            }
            return null;
        }
        const num = parseInt(val, 10);
        return isNaN(num) ? null : num;
    }
    if (typeof val === 'number') {
        return val;
    }
    return null;
}, z.number().nullable());