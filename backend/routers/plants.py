from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from sqlalchemy.orm import Session
from typing import List

import schemas
import crud
import csv_importer
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/plants/", response_model=schemas.Plant, status_code=status.HTTP_201_CREATED)
def create_plant_endpoint(plant: schemas.PlantCreate, db: Session = Depends(get_db)):
    return crud.create_plant(db=db, plant=plant)

@router.get("/plants/", response_model=List[schemas.Plant])
def read_all_plants_endpoint(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return crud.get_all_plants(db, skip=skip, limit=limit)

@router.get("/plants/{plant_id}", response_model=schemas.Plant)
def read_single_plant_endpoint(plant_id: int, db: Session = Depends(get_db)):
    db_plant = crud.get_plant_by_id(db, plant_id=plant_id)
    if db_plant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return db_plant

@router.put("/plants/{plant_id}", response_model=schemas.Plant)
def update_plant_endpoint(plant_id: int, plant: schemas.PlantUpdate, db: Session = Depends(get_db)):
    db_plant = crud.update_plant_by_id(db, plant_id=plant_id, plant_update=plant)
    if db_plant is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return db_plant

@router.delete("/plants/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_plant_endpoint(plant_id: int, db: Session = Depends(get_db)):
    if not crud.delete_plant_by_id(db, plant_id=plant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.post("/plants/import", response_model=schemas.ImportResult)
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

@router.post("/plants/import-mapped", response_model=schemas.ImportResult)
async def import_mapped_plants_endpoint(
    payload: dict,
    db: Session = Depends(get_db),
):
    data = payload.get('data')
    mapping = payload.get('mapping')
    if not data or not mapping:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing data or mapping")

    result = csv_importer.process_mapped_csv_import(db=db, data=data, mapping=mapping)

    if result.errors and not result.imported_count and not result.updated_count:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=result.errors)

    return result
