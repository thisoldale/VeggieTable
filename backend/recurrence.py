from datetime import datetime, date
from dateutil.rrule import rrulestr
from sqlalchemy.orm import Session
import models
import schemas

def get_first_occurrence(rrule_str: str, start_date: date) -> date:
    """
    Gets the first occurrence of a recurrence rule on or after a given start date.
    """
    dtstart = datetime.combine(start_date, datetime.min.time())
    rule = rrulestr(rrule_str, dtstart=dtstart)
    first = rule.after(dtstart, inc=True)
    return first.date() if first else None

def generate_next_task_if_needed(db: Session, completed_task: models.Task):
    """
    If the completed task is part of a recurring series, this function
    generates the next task in the series.
    """
    import crud  # Defer import to avoid circular dependency

    if not completed_task.recurring_task_id:
        return

    recurring_task = crud.get_recurring_task_by_id(db, completed_task.recurring_task_id)
    if not recurring_task:
        return  # Should not happen if data is consistent

    last_due_date = completed_task.due_date
    if not last_due_date:
        return  # Cannot determine next date without a last due date

    dtstart = datetime.combine(last_due_date, datetime.min.time())
    rule = rrulestr(recurring_task.recurrence_rule, dtstart=dtstart)

    # Find the next occurrence *after* the one just completed
    next_due_datetime = rule.after(dtstart)

    # Optional: Add a limit to prevent infinite generation, e.g., for 5 years
    if next_due_datetime and next_due_datetime.year > dtstart.year + 5:
        return

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