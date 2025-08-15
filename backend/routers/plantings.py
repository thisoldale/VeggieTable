from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

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

@router.get("/plantings/{planting_id}", response_model=schemas.PlantingDetail)
def read_single_planting_endpoint(planting_id: int, db: Session = Depends(get_db)):
    db_planting = crud.get_planting_by_id(db, planting_id=planting_id)
    if db_planting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return db_planting

@router.put("/plantings/{planting_id}", response_model=schemas.Planting)
def update_single_planting_endpoint(planting_id: int, planting_update: schemas.PlantingUpdateSchema, db: Session = Depends(get_db)):
    db_planting = crud.update_planting_by_id(db, planting_id=planting_id, planting_update=planting_update)
    if db_planting is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return db_planting

@router.delete("/plantings/{planting_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_single_planting_endpoint(planting_id: int, db: Session = Depends(get_db)):
    if not crud.delete_planting_by_id(db, planting_id=planting_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Planting not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)
