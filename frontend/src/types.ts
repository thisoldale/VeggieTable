// frontend/src/types.ts
// Refactored to remove PlantingGroup and add quantity to Planting.

export interface Plant {
  id: number;
  plant_name: string;
  variety_name?: string | null;
  scientific_name?: string | null;
  plant_family?: string | null;
  plant_type?: string | null;
  growth_habit?: string | null;
  origin_heirloom_status?: string | null;
  organic?: boolean | null;
  seed_company_source?: string | null;
  year_acquired?: number | null;
  seed_size?: string | null;
  seed_longevity_storage_life?: string | null;
  germination_temperature_min?: number | null;
  germination_temperature_max?: number | null;
  germination_temperature_ideal?: number | null;
  germination_time_days?: string | null;
  light_requirement_for_germination?: string | null;
  stratification_required?: boolean | null;
  scarification_required?: boolean | null;
  sowing_depth?: string | null;
  spacing_in_row?: string | null;
  spacing_low?: number | null;
  spacing_high?: number | null;
  direct_seedable?: boolean | null;
  transplantable?: boolean | null;
  days_to_transplant_low?: number | null;
  days_to_transplant_high?: number | null;
  time_to_maturity?: string | null;
  mature_plant_height?: string | null;
  mature_plant_spread_width?: string | null;
  sunlight_requirement?: string | null;
  water_needs?: string | null;
  fertilizer_needs?: string | null;
  pest_resistance?: string | null;
  disease_resistance?: string | null;
  cold_hardiness_frost_tolerance?: string | null;
  heat_tolerance?: string | null;
  drought_tolerance?: string | null;
  bolting_tendency?: string | null;
  support_required?: string | null;
  pruning_required?: string | null;
  harvest_window_low?: number | null;
  harvest_window_high?: number | null;
  typical_yield?: string | null;
  yield_units?: string | null;
  storage_life_post_harvest?: string | null;
  requires_pollinator?: boolean | null;
  notes_observations?: string | null;
  url?: string | null;
  weekly_yield?: string | null;
}

export enum PlantingStatus {
    PLANNED = "Planned",
    STARTED = "Started",
    TRANSPLANTED = "Transplanted",
    DIRECT_SOWN = "Direct Sown",
    GROWING = "Growing",
    HARVESTING = "Harvesting",
    DONE = "Done",
}

export enum PlantingMethod {
    SEED_STARTING = "Seed Starting",
    DIRECT_SEEDING = "Direct Seeding",
    SEEDLING = "Seedling",
}

export enum HarvestMethod {
    SINGLE_HARVEST = "Single Harvest",
    CUT_AND_COME_AGAIN = "Cut and Come Again",
    STAGGERED = "Staggered",
    CONTINUOUS = "Continuous",
}

export enum LogActionType {
    SOW_SEEDS = "Sow Seeds",
    TRANSPLANT = "Transplant",
    FIRST_HARVEST = "First Harvest",
}

export enum TaskStatus {
    PENDING = "Pending",
    IN_PROGRESS = "In Progress",
    COMPLETED = "Completed",
}

export interface Task {
    id: number;
    garden_plan_id: number;
    planting_id?: number | null;
    task_group_id?: number | null;
    recurring_task_id?: number | null;
    name: string;
    description?: string | null;
    due_date?: string | null;
    status: TaskStatus;
}

export interface RecurringTask {
  id: number;
  garden_plan_id: number;
  planting_id?: number;
  name: string;
  description?: string;
  recurrence_rule: string;
  recurrence_end_date?: string;
  exdates?: string[];
  tasks: Task[];
}

// Planting now has all the fields of a Plant, plus its own specific fields.
export interface Planting extends Plant {
    quantity: number;
    status: PlantingStatus;
    library_plant_id: number;
    planned_sow_date?: string | null;
    planned_transplant_date?: string | null;
    planned_harvest_start_date?: string | null;
    planned_harvest_end_date?: string | null;
    planned_second_harvest_date?: string | null;
    time_to_maturity_override?: number | null;
    planting_method?: PlantingMethod | null;
    harvest_method?: HarvestMethod | null;
    tasks: Task[];
    recurring_tasks: RecurringTask[];
}

export interface PlantingCreatePayload {
  library_plant_id: number;
  quantity: number;
  status: PlantingStatus;
  planting_method?: PlantingMethod | null;
  harvest_method?: HarvestMethod | null;
  time_to_maturity_override?: number | null;
  planned_sow_date?: string;
  planned_transplant_date?: string;
  planned_harvest_start_date?: string;
  planned_harvest_end_date?: string;
  planned_second_harvest_date?: string;
}

export interface GardenPlan {
    id: number;
    name: string;
    description?: string | null;
    created_date: string;
    last_accessed_date: string;
    plantings: Planting[];
    tasks: Task[];
    recurring_tasks: RecurringTask[];
}

export type AppContextType = {
  isPageDirty: boolean;
  setIsPageDirty: (isDirty: boolean) => void;
};

export interface LoginCredentials {
    username: string;
    password: string;
}

export interface RegistrationData {
    username: string;
    email: string;
    password: string;
}

export interface User {
    id: number;
    username: string;
    email: string;
}