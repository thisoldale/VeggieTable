from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

import schemas
import crud
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/recurring-tasks/", response_model=schemas.RecurringTask, status_code=status.HTTP_201_CREATED)
def create_recurring_task_endpoint(recurring_task: schemas.RecurringTaskCreate, db: Session = Depends(get_db)):
    """
    Create a new recurring task series. This will also create the first
    instance of the task based on the start date and recurrence rule.
    """
    return crud.create_recurring_task(db=db, recurring_task=recurring_task)

@router.get("/recurring-tasks/{recurring_task_id}", response_model=schemas.RecurringTask)
def read_recurring_task_endpoint(recurring_task_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a recurring task series, including its generated task instances.
    """
    db_recurring_task = crud.get_recurring_task_by_id(db, recurring_task_id=recurring_task_id)
    if db_recurring_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")
    return db_recurring_task

@router.put("/recurring-tasks/{recurring_task_id}", response_model=schemas.RecurringTask)
def update_recurring_task_endpoint(recurring_task_id: int, recurring_task_update: schemas.RecurringTaskUpdate, db: Session = Depends(get_db)):
    """
    Update a recurring task series (e.g., change the name or the rule).
    Note: This does not affect already generated tasks.
    """
    updated_recurring_task = crud.update_recurring_task(db, recurring_task_id=recurring_task_id, recurring_task_update=recurring_task_update)
    if updated_recurring_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")
    return updated_recurring_task

@router.delete("/recurring-tasks/{recurring_task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_recurring_task_endpoint(recurring_task_id: int, db: Session = Depends(get_db)):
    """
    Delete a recurring task series and all its associated task instances.
    """
    if not crud.delete_recurring_task(db, recurring_task_id=recurring_task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recurring task not found")
    return