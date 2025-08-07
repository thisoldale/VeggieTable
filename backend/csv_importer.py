# backend/csv_importer.py
# No changes needed, but provided for completeness.
import io
import csv
from typing import List, Dict, Any, Tuple, Optional
from pydantic import ValidationError
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import crud
import schemas
from models import Plant

# A set of keys that are expected to be boolean values
BOOLEAN_FIELDS = {
    'organic', 'stratification_required', 'scarification_required',
    'direct_seedable', 'transplantable', 'requires_pollinator'
}

# Fields that should be integers
INTEGER_FIELDS = {
    'year_acquired', 'germination_temperature_min', 'germination_temperature_max',
    'germination_temperature_ideal', 'spacing_low', 'spacing_high',
    'days_to_transplant_low', 'days_to_transplant_high', 'harvest_window_low',
    'harvest_window_high'
}


HEADER_MAP = {
    'id': 'id',
    'plant name': 'plant_name',
    'plant_name': 'plant_name',
    'variety name': 'variety_name',
    'variety_name': 'variety_name',
    'scientific name': 'scientific_name',
    'scientific_name': 'scientific_name',
    'plant family': 'plant_family',
    'plant_family': 'plant_family',
    'plant type': 'plant_type',
    'plant_type': 'plant_type',
    'growth habit': 'growth_habit',
    'growth_habit': 'growth_habit',
    'origin/heirloom status': 'origin_heirloom_status',
    'origin_heirloom_status': 'origin_heirloom_status',
    'organic': 'organic',
    'seed company/source': 'seed_company_source',
    'seed_company_source': 'seed_company_source',
    'year acquired': 'year_acquired',
    'year_acquired': 'year_acquired',
    'seed size': 'seed_size',
    'seed_size': 'seed_size',
    'seed longevity': 'seed_longevity_storage_life',
    'seed longevity/storage life': 'seed_longevity_storage_life',
    'seed_longevity_storage_life': 'seed_longevity_storage_life',
    'germ temp (min)': 'germination_temperature_min',
    'germination_temperature_min': 'germination_temperature_min',
    'germ temp (max)': 'germination_temperature_max',
    'germination_temperature_max': 'germination_temperature_max',
    'germ temp (ideal)': 'germination_temperature_ideal',
    'germination_temperature_ideal': 'germination_temperature_ideal',
    'germ time (days)': 'germination_time_days',
    'germination_time_days': 'germination_time_days',
    'light req for germ': 'light_requirement_for_germination',
    'light req. for germination': 'light_requirement_for_germination',
    'light_requirement_for_germination': 'light_requirement_for_germination',
    'stratification req': 'stratification_required',
    'stratification required': 'stratification_required',
    'stratification_required': 'stratification_required',
    'scarification req': 'scarification_required',
    'scarification required': 'scarification_required',
    'scarification_required': 'scarification_required',
    'sowing depth': 'sowing_depth',
    'sowing_depth': 'sowing_depth',
    'spacing - in row': 'spacing_in_row',
    'spacing_in_row': 'spacing_in_row',
    'spacing (low)': 'spacing_low',
    'spacing_low': 'spacing_low',
    'spacing (high)': 'spacing_high',
    'spacing_high': 'spacing_high',
    'direct seedable': 'direct_seedable',
    'direct_seedable': 'direct_seedable',
    'transplantable': 'transplantable',
    'days to transplant (low)': 'days_to_transplant_low',
    'days_to_transplant_low': 'days_to_transplant_low',
    'days to transplant (high)': 'days_to_transplant_high',
    'days_to_transplant_high': 'days_to_transplant_high',
    'time to maturity': 'time_to_maturity',
    'time_to_maturity': 'time_to_maturity',
    'mature plant height': 'mature_plant_height',
    'mature_plant_height': 'mature_plant_height',
    'mature plant spread': 'mature_plant_spread_width',
    'mature plant spread/width': 'mature_plant_spread_width',
    'mature_plant_spread_width': 'mature_plant_spread_width',
    'sunlight req': 'sunlight_requirement',
    'sunlight requirement': 'sunlight_requirement',
    'sunlight_requirement': 'sunlight_requirement',
    'water needs': 'water_needs',
    'water_needs': 'water_needs',
    'fertilizer needs': 'fertilizer_needs',
    'fertilizer_needs': 'fertilizer_needs',
    'pest resistance': 'pest_resistance',
    'pest_resistance': 'pest_resistance',
    'disease resistance': 'disease_resistance',
    'disease_resistance': 'disease_resistance',
    'cold hardiness': 'cold_hardiness_frost_tolerance',
    'cold hardiness/frost tolerance': 'cold_hardiness_frost_tolerance',
    'cold_hardiness_frost_tolerance': 'cold_hardiness_frost_tolerance',
    'heat tolerance': 'heat_tolerance',
    'heat_tolerance': 'heat_tolerance',
    'drought tolerance': 'drought_tolerance',
    'drought_tolerance': 'drought_tolerance',
    'bolting tendency': 'bolting_tendency',
    'bolting_tendency': 'bolting_tendency',
    'support required': 'support_required',
    'support_required': 'support_required',
    'pruning required': 'pruning_required',
    'pruning_required': 'pruning_required',
    'harvest window (low)': 'harvest_window_low',
    'harvest_window_low': 'harvest_window_low',
    'harvest window (high)': 'harvest_window_high',
    'harvest_window_high': 'harvest_window_high',
    'typical yield': 'typical_yield',
    'typical_yield': 'typical_yield',
    'yield units': 'yield_units',
    'yield_units': 'yield_units',
    'storage life': 'storage_life_post_harvest',
    'storage life (post-harvest)': 'storage_life_post_harvest',
    'storage_life_post_harvest': 'storage_life_post_harvest',
    'requires pollinator': 'requires_pollinator',
    'requires_pollinator': 'requires_pollinator',
    'notes/observations': 'notes_observations',
    'notes_observations': 'notes_observations',
    'url': 'url',
    'weekly yield': 'weekly_yield',
    'weekly_yield': 'weekly_yield',
}

def _parse_boolean(value: str) -> Optional[bool]:
    """Intelligently parses a string into a boolean, handling 'Yes'/'No' prefixes."""
    if not value:
        return None
    val_lower = value.strip().lower()
    if val_lower.startswith(('yes', 'true', '1')):
        return True
    if val_lower.startswith(('no', 'false', '0')):
        return False
    return None

def _parse_and_validate_row(row_data: Dict[str, Any], row_num: int) -> Tuple[Optional[Dict], List[str]]:
    """Parses a single CSV row, validates it, and returns cleaned data or errors."""
    plant_data_dict = {}
    errors = []

    for raw_key, value in row_data.items():
        if not raw_key:
            continue
        normalized_key = HEADER_MAP.get(raw_key.strip().lower())
        if normalized_key:
            # Pre-process boolean fields
            if normalized_key in BOOLEAN_FIELDS:
                plant_data_dict[normalized_key] = _parse_boolean(value)
            # Pre-process integer fields
            elif normalized_key in INTEGER_FIELDS:
                if value and value.strip():
                    try:
                        plant_data_dict[normalized_key] = int(value.strip())
                    except (ValueError, TypeError):
                        plant_data_dict[normalized_key] = value # Let Pydantic handle the validation error
                else:
                    plant_data_dict[normalized_key] = None
            # Handle all other fields
            else:
                plant_data_dict[normalized_key] = value.strip() if isinstance(value, str) and value.strip() else None

    if not plant_data_dict.get('plant_name'):
        errors.append(f"Row {row_num}: 'plant_name' is missing or empty.")
        return None, errors

    try:
        schemas.PlantCreate(**plant_data_dict)
        return plant_data_dict, errors
    except ValidationError as e:
        error_details = "; ".join([f"{err['loc'][0]}: {err['msg']}" for err in e.errors()])
        errors.append(f"Row {row_num}: Data validation error: {error_details}")
        return None, errors


def process_csv_import(db: Session, content: bytes, mode: str) -> schemas.ImportResult:
    """Processes a CSV file for import, either appending or replacing data."""
    try:
        csv_content = content.decode('utf-8-sig')
    except UnicodeDecodeError:
        return schemas.ImportResult(message="Import failed.", errors=["File is not UTF-8 encoded."])

    reader = csv.DictReader(io.StringIO(csv_content))
    if not reader.fieldnames:
        return schemas.ImportResult(message="Import failed.", errors=["CSV is empty or has no headers."])

    imported_count = 0
    updated_count = 0
    skipped_count = 0
    total_errors = []

    if mode == "replace":
        try:
            db.query(Plant).delete()
            db.commit()
        except Exception as e:
            db.rollback()
            return schemas.ImportResult(message="Import failed.", errors=[f"Failed to clear existing data: {e}"])

    for i, row in enumerate(reader):
        row_num = i + 2
        
        plant_data, errors = _parse_and_validate_row(row, row_num)

        if errors:
            total_errors.extend(errors)
        
        if not plant_data:
            skipped_count += 1
            continue

        try:
            plant_id_str = plant_data.get('id')
            plant_id = int(plant_id_str) if plant_id_str and plant_id_str.isdigit() else None

            if plant_id and (existing_plant := crud.get_plant_by_id(db, plant_id=plant_id)):
                plant_schema = schemas.PlantUpdate(**plant_data)
                crud.update_plant_by_id(db, plant_id=existing_plant.id, plant_update=plant_schema)
                updated_count += 1
            else:
                plant_data.pop('id', None)
                plant_schema = schemas.PlantCreate(**plant_data)
                crud.create_plant(db, plant=plant_schema)
                imported_count += 1
        except IntegrityError as e:
            db.rollback()
            total_errors.append(f"Row {row_num}: A database integrity error occurred (e.g., duplicate key): {e.orig}")
            skipped_count += 1
        except Exception as e:
            db.rollback()
            total_errors.append(f"Row {row_num}: An unexpected database error occurred: {e}")
            skipped_count += 1

    return schemas.ImportResult(
        message="CSV import process completed.",
        imported_count=imported_count,
        updated_count=updated_count,
        skipped_count=skipped_count,
        errors=total_errors
    )
