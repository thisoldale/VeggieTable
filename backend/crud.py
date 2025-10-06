# backend/crud.py
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc, inspect
from typing import Optional, List, Type
from datetime import datetime
from models import Base
import recurrence

import models, schemas

# --- Generic Helpers ---
def _get_by_id(db: Session, model: Type[Base], item_id: int) -> Optional[Base]:
    """Generic function to get an item by its ID."""
    return db.query(model).filter(model.id == item_id).first()

# --- Query Options Helpers ---
def _get_garden_plan_load_options() -> List:
    """Returns common SQLAlchemy load options for GardenPlan queries."""
    return [
        joinedload(models.GardenPlan.plantings),
        joinedload(models.GardenPlan.tasks),
        joinedload(models.GardenPlan.recurring_tasks)
    ]

# --- Plant CRUD ---
def get_plant_by_id(db: Session, plant_id: int):
    return _get_by_id(db, models.Plant, plant_id)

def get_all_plants(db: Session, skip: int = 0, limit: int = 1000):
    return db.query(models.Plant).order_by(models.Plant.plant_name).offset(skip).limit(limit).all()

def create_plant(db: Session, plant: schemas.PlantCreate):
    db_plant = models.Plant(**plant.model_dump())
    db.add(db_plant)
    db.commit()
    db.refresh(db_plant)
    return db_plant

def update_plant_by_id(db: Session, plant_id: int, plant_update: schemas.PlantUpdate):
    db_plant = get_plant_by_id(db, plant_id)
    if db_plant:
        update_data = plant_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_plant, key, value)
        db.commit()
        db.refresh(db_plant)
    return db_plant

def delete_plant_by_id(db: Session, plant_id: int):
    db_plant = get_plant_by_id(db, plant_id)
    if db_plant:
        db.delete(db_plant)
        db.commit()
        return True
    return False

def get_tasks_by_group_id(db: Session, group_id: int):
    return db.query(models.Task).filter(models.Task.task_group_id == group_id).all()

def update_tasks_in_group(db: Session, group_id: int, date_diff_days: int):
    from datetime import timedelta
    tasks = get_tasks_by_group_id(db, group_id)
    if not tasks:
        return []

    for task in tasks:
        if task.due_date:
            task.due_date += timedelta(days=date_diff_days)

    db.commit()
    for task in tasks:
        db.refresh(task)

    return tasks

def unlink_tasks_in_group(db: Session, group_id: int):
    tasks = get_tasks_by_group_id(db, group_id)
    if not tasks:
        return []

    for task in tasks:
        task.task_group_id = None

    db.commit()
    for task in tasks:
        db.refresh(task)

    return tasks

# --- Garden Plan CRUD ---
def get_garden_plan_by_id(db: Session, plan_id: int):
    return (
        db.query(models.GardenPlan)
        .options(*_get_garden_plan_load_options())
        .filter(models.GardenPlan.id == plan_id)
        .first()
    )

def get_all_garden_plans(db: Session, skip: int = 0, limit: int = 100):
    return (
        db.query(models.GardenPlan)
        .options(*_get_garden_plan_load_options())
        .order_by(desc(models.GardenPlan.last_accessed_date))
        .offset(skip)
        .limit(limit)
        .all()
    )
    
def create_garden_plan(db: Session, plan: schemas.GardenPlanCreate):
    db_plan = models.GardenPlan(**plan.model_dump())
    db.add(db_plan)
    db.commit()
    db.refresh(db_plan)
    return get_garden_plan_by_id(db, plan_id=db_plan.id)

def delete_garden_plan_by_id(db: Session, plan_id: int):
    db_plan = get_garden_plan_by_id(db, plan_id)
    if db_plan:
        db.delete(db_plan)
        db.commit()
        return True
    return False

# THIS IS THE CORRECTED FUNCTION
def get_most_recent_garden_plan(db: Session):
    return (
        db.query(models.GardenPlan)
        .options(*_get_garden_plan_load_options())
        .order_by(desc(models.GardenPlan.last_accessed_date))
        .first()
    )

def touch_garden_plan(db: Session, plan_id: int):
    db_plan = get_garden_plan_by_id(db, plan_id)
    if db_plan:
        db_plan.last_accessed_date = datetime.utcnow()
        db.commit()
        db.refresh(db_plan)
    return db_plan

# --- Planting CRUD ---
def get_planting_by_id(db: Session, planting_id: int):
    return (
        db.query(models.Planting)
        .filter(models.Planting.id == planting_id)
        .first()
    )

def create_planting(db: Session, garden_plan_id: int, planting_details: schemas.PlantingCreate):
    library_plant = get_plant_by_id(db, planting_details.library_plant_id)
    if not library_plant:
        return None

    plant_columns = [c.key for c in inspect(models.Plant).attrs if hasattr(models.Planting, c.key) and c.key != 'id']
    plant_data = {col: getattr(library_plant, col) for col in plant_columns}
    
    new_planting = models.Planting(**plant_data)
    
    # Set planting-specific fields from the payload
    new_planting.garden_plan_id = garden_plan_id
    new_planting.library_plant_id = planting_details.library_plant_id
    new_planting.quantity = planting_details.quantity
    new_planting.status = planting_details.status
    new_planting.planting_method = planting_details.planting_method
    new_planting.time_to_maturity_override = planting_details.time_to_maturity_override
    new_planting.planned_sow_date = planting_details.planned_sow_date
    new_planting.planned_transplant_date = planting_details.planned_transplant_date
    new_planting.planned_harvest_start_date = planting_details.planned_harvest_start_date

    db.add(new_planting)
    db.commit()
    db.refresh(new_planting)
        
    return new_planting

def update_planting_by_id(db: Session, planting_id: int, planting_update: schemas.PlantingUpdateSchema):
    db_planting = get_planting_by_id(db, planting_id)
    if db_planting:
        update_data = planting_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_planting, key, value)
        db.commit()
        db.refresh(db_planting)
    return db_planting

def delete_planting_by_id(db: Session, planting_id: int):
    db_planting = get_planting_by_id(db, planting_id)
    if db_planting:
        db.delete(db_planting)
        db.commit()
        return True
    return False

# --- Recurring Task CRUD ---
def get_recurring_task_by_id(db: Session, recurring_task_id: int):
    return db.query(models.RecurringTask).options(joinedload(models.RecurringTask.tasks)).filter(models.RecurringTask.id == recurring_task_id).first()

def create_recurring_task(db: Session, recurring_task: schemas.RecurringTaskCreate):
    """
    Creates a new recurring task series and its first task instance.
    """
    # Create the recurring task master record
    db_recurring_task = models.RecurringTask(
        name=recurring_task.name,
        description=recurring_task.description,
        recurrence_rule=recurring_task.recurrence_rule,
        garden_plan_id=recurring_task.garden_plan_id,
        planting_id=recurring_task.planting_id,
    )
    db.add(db_recurring_task)
    db.commit()
    db.refresh(db_recurring_task)

    # Generate the very first task instance from the specified start_date
    first_due_date = recurrence.get_first_occurrence(recurring_task.recurrence_rule, recurring_task.start_date)
    if first_due_date:
        task_create = schemas.TaskCreate(
            name=db_recurring_task.name,
            description=db_recurring_task.description,
            due_date=first_due_date,
            garden_plan_id=db_recurring_task.garden_plan_id,
            planting_id=db_recurring_task.planting_id,
            recurring_task_id=db_recurring_task.id,
            status=schemas.TaskStatus.PENDING,
        )
        create_task(db, task_create)

    # Refresh again to load the new task into the relationship
    db.refresh(db_recurring_task)
    return db_recurring_task

def update_recurring_task(db: Session, recurring_task_id: int, recurring_task_update: schemas.RecurringTaskUpdate):
    db_recurring_task = get_recurring_task_by_id(db, recurring_task_id)
    if db_recurring_task:
        update_data = recurring_task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_recurring_task, key, value)
        db.commit()
        db.refresh(db_recurring_task)
    return db_recurring_task

def delete_recurring_task(db: Session, recurring_task_id: int):
    db_recurring_task = get_recurring_task_by_id(db, recurring_task_id)
    if db_recurring_task:
        # The cascade delete on the model will handle deleting associated tasks
        db.delete(db_recurring_task)
        db.commit()
        return True
    return False

# --- Task CRUD ---
def get_task_by_id(db: Session, task_id: int):
    return _get_by_id(db, models.Task, task_id)

def get_tasks_for_plan(db: Session, plan_id: int, skip: int = 0, limit: int = 100):
    return db.query(models.Task).filter(models.Task.garden_plan_id == plan_id).offset(skip).limit(limit).all()

def create_task(db: Session, task: schemas.TaskCreate):
    db_task = models.Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task

def update_task(db: Session, task_id: int, task_update: schemas.TaskUpdate):
    db_task = get_task_by_id(db, task_id)
    if db_task:
        # Check if the task is being completed in this update
        is_being_completed = (
            task_update.status == schemas.TaskStatus.COMPLETED and
            db_task.status != schemas.TaskStatus.COMPLETED
        )

        # Apply the update
        update_data = task_update.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_task, key, value)

        db.commit()
        db.refresh(db_task)

        # If it was completed, try to generate the next task
        if is_being_completed:
            recurrence.generate_next_task_if_needed(db, db_task)

    return db_task

def delete_task(db: Session, task_id: int):
    db_task = get_task_by_id(db, task_id)
    if db_task:
        db.delete(db_task)
        db.commit()
        return True
    return False