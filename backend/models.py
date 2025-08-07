# backend/models.py
# Removed PlantingGroup and added quantity to Planting.
from sqlalchemy import Boolean, Integer, String, Date, Float, ForeignKey, Enum, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from typing import Optional, List
from datetime import datetime
import enum

from database import Base

class Plant(Base):
    __tablename__ = "plants"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plant_name: Mapped[str] = mapped_column(String, index=True)
    variety_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scientific_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plant_family: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plant_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    growth_habit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    origin_heirloom_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    organic: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    seed_company_source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    year_acquired: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seed_size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    seed_longevity_storage_life: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    germination_temperature_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_temperature_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_temperature_ideal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_time_days: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    light_requirement_for_germination: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stratification_required: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    scarification_required: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    sowing_depth: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    spacing_in_row: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    spacing_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    spacing_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    direct_seedable: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    transplantable: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    days_to_transplant_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_to_transplant_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_to_maturity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mature_plant_height: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mature_plant_spread_width: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sunlight_requirement: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    water_needs: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fertilizer_needs: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pest_resistance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    disease_resistance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cold_hardiness_frost_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    heat_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    drought_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bolting_tendency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    support_required: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pruning_required: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    harvest_window_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    harvest_window_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    typical_yield: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    yield_units: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    storage_life_post_harvest: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    requires_pollinator: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    notes_observations: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    weekly_yield: Mapped[Optional[str]] = mapped_column(String, nullable=True)

class GardenPlan(Base):
    __tablename__ = "garden_plans"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, index=True)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    created_date: Mapped[datetime] = mapped_column(Date, default=datetime.utcnow)
    last_accessed_date: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
    
    plantings: Mapped[List["Planting"]] = relationship(back_populates="garden_plan", cascade="all, delete-orphan")
    tasks: Mapped[List["Task"]] = relationship(back_populates="garden_plan", cascade="all, delete-orphan")

class PlantingMethod(str, enum.Enum):
    SEED_STARTING = "Seed Starting"
    DIRECT_SEEDING = "Direct Seeding"
    SEEDLING = "Seedling"

class PlantingStatus(str, enum.Enum):
    PLANNED = "Planned"
    STARTED = "Started"
    TRANSPLANTED = "Transplanted"
    DIRECT_SOWN = "Direct Sown"
    GROWING = "Growing"
    HARVESTING = "Harvesting"
    DONE = "Done"

class Planting(Base):
    __tablename__ = "plantings"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    garden_plan_id: Mapped[int] = mapped_column(ForeignKey("garden_plans.id"))
    library_plant_id: Mapped[int] = mapped_column(ForeignKey("plants.id"))
    
    # --- Planting-specific fields ---
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    status: Mapped[PlantingStatus] = mapped_column(Enum(PlantingStatus), default=PlantingStatus.PLANNED)
    planting_method: Mapped[Optional[PlantingMethod]] = mapped_column(Enum(PlantingMethod), nullable=True)
    planned_sow_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    planned_transplant_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    planned_harvest_start_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    time_to_maturity_override: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # --- Fields copied from Plant library record at creation time ---
    plant_name: Mapped[str] = mapped_column(String, index=True)
    variety_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    scientific_name: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plant_family: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    plant_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    growth_habit: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    origin_heirloom_status: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    organic: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    seed_company_source: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    year_acquired: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    seed_size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    seed_longevity_storage_life: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    germination_temperature_min: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_temperature_max: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_temperature_ideal: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    germination_time_days: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    light_requirement_for_germination: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    stratification_required: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    scarification_required: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    sowing_depth: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    spacing_in_row: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    spacing_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    spacing_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    direct_seedable: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    transplantable: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    days_to_transplant_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_to_transplant_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    time_to_maturity: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mature_plant_height: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    mature_plant_spread_width: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    sunlight_requirement: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    water_needs: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    fertilizer_needs: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pest_resistance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    disease_resistance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cold_hardiness_frost_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    heat_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    drought_tolerance: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bolting_tendency: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    support_required: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    pruning_required: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    harvest_window_low: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    harvest_window_high: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    typical_yield: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    yield_units: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    storage_life_post_harvest: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    requires_pollinator: Mapped[Optional[bool]] = mapped_column(Boolean, default=False, nullable=True)
    notes_observations: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    weekly_yield: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    
    # --- Relationships ---
    garden_plan: Mapped["GardenPlan"] = relationship(back_populates="plantings")
    tasks: Mapped[List["Task"]] = relationship(back_populates="planting", cascade="all, delete-orphan")

class TaskStatus(str, enum.Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    garden_plan_id: Mapped[int] = mapped_column(ForeignKey("garden_plans.id"))
    planting_id: Mapped[Optional[int]] = mapped_column(ForeignKey("plantings.id"), nullable=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    due_date: Mapped[Optional[datetime]] = mapped_column(Date, nullable=True)
    status: Mapped[TaskStatus] = mapped_column(Enum(TaskStatus), default=TaskStatus.PENDING)

    garden_plan: Mapped["GardenPlan"] = relationship(back_populates="tasks")
    planting: Mapped[Optional["Planting"]] = relationship(back_populates="tasks")
