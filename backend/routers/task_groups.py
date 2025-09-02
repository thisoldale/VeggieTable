from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
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

class TaskGroupUpdatePayload(BaseModel):
    date_diff_days: int

@router.put("/api/task-groups/{group_id}", response_model=List[schemas.Task])
def update_task_group_endpoint(group_id: int, payload: TaskGroupUpdatePayload, db: Session = Depends(get_db)):
    updated_tasks = crud.update_tasks_in_group(db, group_id=group_id, date_diff_days=payload.date_diff_days)
    if not updated_tasks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task group not found or no tasks in group")
    return updated_tasks

@router.put("/api/task-groups/{group_id}/unlink", response_model=List[schemas.Task])
def unlink_task_group_endpoint(group_id: int, db: Session = Depends(get_db)):
    updated_tasks = crud.unlink_tasks_in_group(db, group_id=group_id)
    if not updated_tasks:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task group not found or no tasks in group")
    return updated_tasks
