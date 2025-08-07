# backend/main.py
# Removed PlantingGroup endpoints and updated planting creation endpoint.
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
import crud
import csv_importer
from database import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8444"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Garden Plan Endpoints ---
@app.post("/garden-plans/", response_model=schemas.GardenPlan, status_code=status.HTTP_201_CREATED)
def create_garden_plan_endpoint(plan: schemas.GardenPlanCreate, db: Session = Depends(get_db)):
    return crud.create_garden_plan(db=db, plan=plan)

@app.get("/garden-plans/most-recent", response_model=Optional[schemas.GardenPlan])
def read_most_recent_garden_plan_endpoint(db: Session = Depends(get_db)):
    return crud.get_most_recent_garden_plan(db)

@app.get("/garden-plans/", response_model=List[schemas.GardenPlan])
def read_all_garden_plans_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_garden_plans(db, skip=skip, limit=limit)

@app.get("/garden-plans/{plan_id}", response_model=schemas.GardenPlan)
def read_single_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    db_plan = crud.get_garden_plan_by_id(db, plan_id=plan_id)
    if db_plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garden Plan not found")
    return db_plan

@app.delete("/garden-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    if not crud.delete_garden_plan_by_id(db, plan_id=plan_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garden Plan not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.put("/garden-plans/{plan_id}/touch", response_model=schemas.GardenPlan)
def touch_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    db_plan = crud.touch_garden_plan(db, plan_id=plan_id)
    if db_plan is None:
        raise HTTPException(status_code=404, detail="Garden plan not found")
    return db_plan

@app.post("/garden-plans/{plan_id}/plantings", response_model=schemas.Planting, status_code=status.HTTP_201_CREATED)
def create_planting_for_plan_endpoint(plan_id: int, planting_details: schemas.PlantingCreate, db: Session = Depends(get_db)):
    created = crud.create_planting(db, garden_plan_id=plan_id, planting_details=planting_details)
    if created is None:
        raise HTTPException(status_code=404, detail="Library plant not found")
    return created

# --- Plant Library Endpoints ---
@app.post("/plants/", response_model=schemas.Plant, status_code=status.HTTP_201_CREATED)
def create_plant_endpoint(plant: schemas.PlantCreate, db: Session = Depends(get_db)):
    return crud.create_plant(db=db, plant=plant)

@app.get("/plants/", response_model=List[schemas.Plant])
def read_all_plants_endpoint(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.get_all_plants(db, skip=skip, limit=limit)

@app.get("/plants/{plant_id}", response_model=schemas.Plant)
def read_single_plant_endpoint(plant_id: int, db: Session = Depends(get_db)):
    db_plant = crud.get_plant_by_id(db, plant_id=plant_id)
    if db_plant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return db_plant

@app.put("/plants/{plant_id}", response_model=schemas.Plant)
def update_plant_endpoint(plant_id: int, plant: schemas.PlantUpdate, db: Session = Depends(get_db)):
    db_plant = crud.update_plant_by_id(db, plant_id=plant_id, plant_update=plant)
    if db_plant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return db_plant

@app.delete("/plants/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant_endpoint(plant_id: int, db: Session = Depends(get_db)):
    if not crud.delete_plant_by_id(db, plant_id=plant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@app.post("/plants/import", response_model=schemas.ImportResult)
async def import_plants_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    mode: str = Query("append", enum=["append", "replace"])
):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid file type. Please upload a CSV file.")
    
    content = await file.read()
    result = csv_importer.process_csv_import(db=db, content=content, mode=mode)
    
    if result.errors and not result.imported_count and not result.updated_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.errors)

    return result

# --- Planting Endpoints ---
@app.get("/plantings/{planting_id}", response_model=schemas.PlantingDetail)
def read_single_planting_endpoint(planting_id: int, db: Session = Depends(get_db)):
    db_planting = crud.get_planting_by_id(db, planting_id=planting_id)
    if db_planting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return db_planting

@app.put("/plantings/{planting_id}", response_model=schemas.Planting)
def update_single_planting_endpoint(planting_id: int, planting_update: schemas.PlantingUpdateSchema, db: Session = Depends(get_db)):
    db_planting = crud.update_planting_by_id(db, planting_id=planting_id, planting_update=planting_update)
    if db_planting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return db_planting
    
@app.delete("/plantings/{planting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_planting_endpoint(planting_id: int, db: Session = Depends(get_db)):
    if not crud.delete_planting_by_id(db, planting_id=planting_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# --- Task Endpoints ---
@app.post("/tasks/", response_model=schemas.Task, status_code=status.HTTP_201_CREATED)
def create_task_endpoint(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    return crud.create_task(db=db, task=task)

@app.get("/garden-plans/{plan_id}/tasks/", response_model=List[schemas.Task])
def read_tasks_for_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    return crud.get_tasks_for_plan(db, plan_id=plan_id)

@app.put("/tasks/{task_id}", response_model=schemas.Task)
def update_task_endpoint(task_id: int, task_update: schemas.TaskUpdate, db: Session = Depends(get_db)):
    updated_task = crud.update_task(db, task_id=task_id, task_update=task_update)
    if updated_task is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return updated_task

@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task_endpoint(task_id: int, db: Session = Depends(get_db)):
    if not crud.delete_task(db, task_id=task_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
