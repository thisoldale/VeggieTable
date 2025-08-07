from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from typing import List, Optional

import models
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

@router.post("/garden-plans/", response_model=schemas.GardenPlan, status_code=status.HTTP_201_CREATED)
def create_garden_plan_endpoint(plan: schemas.GardenPlanCreate, db: Session = Depends(get_db)):
    return crud.create_garden_plan(db=db, plan=plan)

@router.get("/garden-plans/most-recent", response_model=Optional[schemas.GardenPlan])
def read_most_recent_garden_plan_endpoint(db: Session = Depends(get_db)):
    return crud.get_most_recent_garden_plan(db)

@router.get("/garden-plans/", response_model=List[schemas.GardenPlan])
def read_all_garden_plans_endpoint(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_all_garden_plans(db, skip=skip, limit=limit)

@router.get("/garden-plans/{plan_id}", response_model=schemas.GardenPlan)
def read_single_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    db_plan = crud.get_garden_plan_by_id(db, plan_id=plan_id)
    if db_plan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garden Plan not found")
    return db_plan

@router.delete("/garden-plans/{plan_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    if not crud.delete_garden_plan_by_id(db, plan_id=plan_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Garden Plan not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.put("/garden-plans/{plan_id}/touch", response_model=schemas.GardenPlan)
def touch_garden_plan_endpoint(plan_id: int, db: Session = Depends(get_db)):
    db_plan = crud.touch_garden_plan(db, plan_id=plan_id)
    if db_plan is None:
        raise HTTPException(status_code=404, detail="Garden plan not found")
    return db_plan

@router.post("/garden-plans/{plan_id}/plantings", response_model=schemas.Planting, status_code=status.HTTP_201_CREATED)
def create_planting_for_plan_endpoint(plan_id: int, planting_details: schemas.PlantingCreate, db: Session = Depends(get_db)):
    created = crud.create_planting(db, garden_plan_id=plan_id, planting_details=planting_details)
    if created is None:
        raise HTTPException(status_code=404, detail="Library plant not found")
    return created
