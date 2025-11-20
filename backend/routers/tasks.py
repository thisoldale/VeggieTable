from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta

import schemas
import crud
import recurrence
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/tasks/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task=task)

@router.get("/garden-plans/{plan_id}/tasks/", response_model=List[schemas.Task])
def read_tasks_for_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    db_tasks = crud.get_tasks_for_plan(db, plan_id=plan_id)
    all_tasks = []

    start_date = date.today()
    end_date = start_date + timedelta(days=365)

    try:
        for task in db_tasks:
            if task.recurrence_rule:
                # print(f"Processing Task ID: {task.id}, RRULE: {task.recurrence_rule}")
                try:
                    all_tasks.extend(recurrence.get_occurrences(task, start_date, end_date))
                except Exception as e:
                    print(f"Error processing task {task.id}: {e}")
                    # Continue processing other tasks instead of crashing
                    # But also log to file for me to see
                    with open("bad_tasks.log", "a") as f:
                        f.write(f"Task ID: {task.id}, RRULE: {task.recurrence_rule}, Error: {e}\n")
                    # Add the original task so it's not lost, even if recurrence fails
                    all_tasks.append(task)
            else:
                all_tasks.append(task)
    except Exception as e:
        import traceback
        with open("error.log", "w") as f:
            f.write(traceback.format_exc())
        raise e

    return all_tasks

@router.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task_endpoint(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    updated_task = crud.update_task(db, task_id=task_id, task_update=task_update)
    if updated_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return updated_task

@router.post("/tasks/{task_id}/complete", response_model=schemas.Task)
def complete_task_occurrence_endpoint(task_id: int, completion: schemas.TaskOccurrenceCompletion, db: Session = Depends(get_db)):
    updated_task = crud.complete_task_occurrence(db, task_id=task_id, completion_date=completion.completion_date)
    if updated_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return updated_task

@router.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(task_id: int, db: Session = Depends(get_db)):
    if not crud.delete_task(db, task_id=task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
