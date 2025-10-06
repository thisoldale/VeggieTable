from datetime import datetime, date, timedelta
from typing import List
from dateutil.rrule import rrulestr
from sqlalchemy.orm import Session
import models
import schemas
import crud

def get_occurrences_between(rrule_str: str, start_dt: datetime, end_dt: datetime, exdates: List[date] = None) -> List[date]:
    """
    Returns a list of all occurrence dates for a given RRULE between two dates,
    respecting a list of exception dates.
    """
    rule = rrulestr(rrule_str, dtstart=datetime.combine(start_dt.date(), datetime.min.time()))
    _exdates = set(exdates or [])
    potential_occurrences = rule.between(start_dt - timedelta(days=1), end_dt + timedelta(days=1), inc=True)

    final_occurrences = []
    for occurrence in potential_occurrences:
        occurrence_date = occurrence.date()
        if start_dt.date() <= occurrence_date <= end_dt.date() and occurrence_date not in _exdates:
            final_occurrences.append(occurrence_date)

    return sorted(list(set(final_occurrences)))

def populate_initial_tasks(db: Session, recurring_task: models.RecurringTask, start_date: date):
    """
    Generates and creates the initial set of task instances for a new recurring series.
    It populates tasks for a predefined window (e.g., 6 months).
    """
    end_of_window = datetime.combine(start_date, datetime.min.time()) + timedelta(days=180)

    effective_end_date = end_of_window.date()
    if recurring_task.recurrence_end_date and recurring_task.recurrence_end_date < effective_end_date:
        effective_end_date = recurring_task.recurrence_end_date

    start_dt = datetime.combine(start_date, datetime.min.time())
    end_dt = datetime.combine(effective_end_date, datetime.max.time())

    exdates = set(recurring_task.exdates or [])

    new_due_dates = get_occurrences_between(
        recurring_task.recurrence_rule,
        start_dt,
        end_dt,
        list(exdates)
    )

    for due_date in new_due_dates:
        task_create = schemas.TaskCreate(
            name=recurring_task.name,
            description=recurring_task.description,
            due_date=due_date,
            garden_plan_id=recurring_task.garden_plan_id,
            planting_id=recurring_task.planting_id,
            recurring_task_id=recurring_task.id,
            status=schemas.TaskStatus.PENDING,
        )
        crud.create_task(db, task_create)

def generate_next_task_if_needed(db: Session, completed_task: models.Task):
    """
    If the completed task is part of a recurring series, this function
    generates the next task in the series, skipping any dates in the exdates list.
    """
    if not completed_task.recurring_task_id:
        return

    recurring_task = crud.get_recurring_task_by_id(db, completed_task.recurring_task_id)
    if not recurring_task:
        return

    last_due_date = completed_task.due_date
    if not last_due_date:
        return

    dtstart = datetime.combine(last_due_date, datetime.min.time())
    rule = rrulestr(recurring_task.recurrence_rule, dtstart=dtstart)
    exdates = set(recurring_task.exdates or [])

    next_due_datetime = None
    current_dt = dtstart
    while True:
        next_occurrence = rule.after(current_dt)

        if not next_occurrence: break
        if recurring_task.recurrence_end_date and next_occurrence.date() > recurring_task.recurrence_end_date: break
        if next_occurrence.year > dtstart.year + 5: break

        if next_occurrence.date() not in exdates:
            task_exists = db.query(models.Task).filter(
                models.Task.recurring_task_id == recurring_task.id,
                models.Task.due_date == next_occurrence.date()
            ).first()

            if not task_exists:
                next_due_datetime = next_occurrence
                break

        current_dt = next_occurrence

    if next_due_datetime:
        next_task = schemas.TaskCreate(
            name=recurring_task.name,
            description=recurring_task.description,
            due_date=next_due_datetime.date(),
            garden_plan_id=recurring_task.garden_plan_id,
            planting_id=recurring_task.planting_id,
            recurring_task_id=recurring_task.id,
            status=schemas.TaskStatus.PENDING,
        )
        crud.create_task(db, next_task)

def regenerate_future_tasks(db: Session, recurring_task: models.RecurringTask):
    """
    Deletes all future, pending tasks and regenerates them based on the
    (potentially updated) recurrence rule.
    """
    today = datetime.utcnow().date()
    (
        db.query(models.Task)
        .filter(
            models.Task.recurring_task_id == recurring_task.id,
            models.Task.due_date >= today,
            models.Task.status == schemas.TaskStatus.PENDING,
        )
        .delete(synchronize_session=False)
    )
    db.flush()

    populate_initial_tasks(db, recurring_task, start_date=today)