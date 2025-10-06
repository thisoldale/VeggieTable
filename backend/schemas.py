# backend/schemas.py
# Removed PlantingGroup schemas and updated Planting schemas.
from pydantic import BaseModel, ConfigDict, create_model
from typing import Optional, List, Type
from datetime import date, datetime
from models import PlantingStatus, PlantingMethod, TaskStatus, HarvestMethod
import enum


# --- Helper function for creating update schemas ---
def make_optional(model: Type[BaseModel]) -> Type[BaseModel]:
    """Creates a new Pydantic model with all fields from the original model made optional."""
    fields = model.model_fields
    optional_fields = {name: (Optional[field.annotation], None) for name, field in fields.items()}
    return create_model(f'{model.__name__}Update', **optional_fields)

class ImportResult(BaseModel):
    message: str
    imported_count: int = 0
    updated_count: int = 0
    skipped_count: int = 0
    errors: List[str] = []

# --- Plant Schemas ---
class PlantBase(BaseModel):
    plant_name: str
    variety_name: Optional[str] = None
    scientific_name: Optional[str] = None
    plant_family: Optional[str] = None
    plant_type: Optional[str] = None
    growth_habit: Optional[str] = None
    origin_heirloom_status: Optional[str] = None
    organic: Optional[bool] = False
    seed_company_source: Optional[str] = None
    year_acquired: Optional[int] = None
    seed_size: Optional[str] = None
    seed_longevity_storage_life: Optional[str] = None
    germination_temperature_min: Optional[int] = None
    germination_temperature_max: Optional[int] = None
    germination_temperature_ideal: Optional[int] = None
    germination_time_days: Optional[str] = None
    light_requirement_for_germination: Optional[str] = None
    stratification_required: Optional[bool] = False
    scarification_required: Optional[bool] = False
    sowing_depth: Optional[str] = None
    spacing_in_row: Optional[str] = None
    spacing_low: Optional[int] = None
    spacing_high: Optional[int] = None
    direct_seedable: Optional[bool] = False
    transplantable: Optional[bool] = False
    days_to_transplant_low: Optional[int] = None
    days_to_transplant_high: Optional[int] = None
    time_to_maturity: Optional[str] = None
    mature_plant_height: Optional[str] = None
    mature_plant_spread_width: Optional[str] = None
    sunlight_requirement: Optional[str] = None
    water_needs: Optional[str] = None
    fertilizer_needs: Optional[str] = None
    pest_resistance: Optional[str] = None
    disease_resistance: Optional[str] = None
    cold_hardiness_frost_tolerance: Optional[str] = None
    heat_tolerance: Optional[str] = None
    drought_tolerance: Optional[str] = None
    bolting_tendency: Optional[str] = None
    support_required: Optional[str] = None
    pruning_required: Optional[str] = None
    harvest_window_low: Optional[int] = None
    harvest_window_high: Optional[int] = None
    typical_yield: Optional[str] = None
    yield_units: Optional[str] = None
    storage_life_post_harvest: Optional[str] = None
    requires_pollinator: Optional[bool] = False
    notes_observations: Optional[str] = None
    url: Optional[str] = None
    weekly_yield: Optional[str] = None

class PlantCreate(PlantBase):
    pass

PlantUpdate = make_optional(PlantBase)

class Plant(PlantBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

# --- Task Group Schemas ---
class TaskGroupBase(BaseModel):
    pass

class TaskGroupCreate(TaskGroupBase):
    pass

class TaskGroup(TaskGroupBase):
    id: int
    tasks: List["Task"] = []
    model_config = ConfigDict(from_attributes=True)

# --- Recurring Task Schemas ---
class RecurringTaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    recurrence_rule: str  # RRULE string
    recurrence_end_date: Optional[date] = None

class RecurringTaskCreate(RecurringTaskBase):
    garden_plan_id: int
    planting_id: Optional[int] = None
    start_date: date
    exdates: Optional[List[date]] = []

class RecurringTaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    recurrence_rule: Optional[str] = None
    recurrence_end_date: Optional[date] = None
    exdates: Optional[List[date]] = None

# --- Task Schemas ---
class TaskBase(BaseModel):
    name: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: TaskStatus = TaskStatus.PENDING

class TaskCreate(TaskBase):
    garden_plan_id: int
    planting_id: Optional[int] = None
    task_group_id: Optional[int] = None
    recurring_task_id: Optional[int] = None

class TaskUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[TaskStatus] = None
    task_group_id: Optional[int] = None

class Task(TaskBase):
    id: int
    garden_plan_id: int
    planting_id: Optional[int] = None
    task_group_id: Optional[int] = None
    recurring_task_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class RecurringTask(RecurringTaskBase):
    id: int
    garden_plan_id: int
    planting_id: Optional[int] = None
    tasks: List[Task] = []
    model_config = ConfigDict(from_attributes=True)

# --- Planting Schemas ---
class Planting(PlantBase):
    id: int
    library_plant_id: int
    quantity: int
    status: PlantingStatus
    planned_sow_date: Optional[date] = None
    planned_transplant_date: Optional[date] = None
    planned_harvest_start_date: Optional[date] = None
    planned_harvest_end_date: Optional[date] = None
    planned_second_harvest_date: Optional[date] = None
    time_to_maturity_override: Optional[int] = None
    planting_method: Optional[PlantingMethod] = None
    harvest_method: Optional[HarvestMethod] = None
    tasks: List[Task] = []
    recurring_tasks: List[RecurringTask] = []
    model_config = ConfigDict(from_attributes=True)

class PlantingCreate(BaseModel):
    library_plant_id: int
    quantity: int = 1
    status: PlantingStatus = PlantingStatus.PLANNED
    planting_method: Optional[PlantingMethod] = None
    harvest_method: Optional[HarvestMethod] = None
    time_to_maturity_override: Optional[int] = None
    planned_sow_date: Optional[date] = None
    planned_transplant_date: Optional[date] = None
    planned_harvest_start_date: Optional[date] = None
    planned_harvest_end_date: Optional[date] = None
    planned_second_harvest_date: Optional[date] = None

PlantingUpdateSchema = make_optional(Planting)

class PlantingDetail(Planting):
    model_config = ConfigDict(from_attributes=True)

# --- Action Schemas ---
class LogActionType(str, enum.Enum):
    SOW_SEEDS = "Sow Seeds"
    TRANSPLANT = "Transplant"
    FIRST_HARVEST = "First Harvest"

class LogAction(BaseModel):
    action_type: LogActionType
    action_date: date
    quantity: int = 1

# --- Garden Plan Schemas ---
class GardenPlanBase(BaseModel):
    name: str
    description: Optional[str] = None

class GardenPlanCreate(GardenPlanBase):
    pass

GardenPlanUpdate = make_optional(GardenPlanBase)

class GardenPlan(GardenPlanBase):
    id: int
    created_date: date
    last_accessed_date: datetime
    plantings: List[Planting] = []
    tasks: List[Task] = []
    recurring_tasks: List[RecurringTask] = []
    model_config = ConfigDict(from_attributes=True)
