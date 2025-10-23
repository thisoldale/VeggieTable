from datetime import datetime, date, timedelta
from typing import List
from dateutil.rrule import rrulestr, rrule
from schemas import Task, TaskStatus

def get_occurrences(task: Task, start_date: date, end_date: date) -> List[Task]:
    """
    Generates a list of task occurrences for a given recurring task within a date range.
    """
    if not task.recurrence_rule or not task.due_date:
        return [task]

    rule = rrulestr(task.recurrence_rule, dtstart=datetime.combine(task.due_date, datetime.min.time()))
    occurrences = []

    # Iterate through occurrences and create virtual tasks
    for occurrence_dt in rule.between(datetime.combine(start_date, datetime.min.time()), datetime.combine(end_date, datetime.max.time()), inc=True):
        occurrence_date = occurrence_dt.date()

        # Skip exdates
        if task.exdates and occurrence_date in task.exdates:
            continue

        # Create a new task instance for the occurrence
        occurrence_task = Task.model_validate(task.model_dump())
        occurrence_task.due_date = occurrence_date

        # Set status to COMPLETED if the date is in completed_dates
        if task.completed_dates and occurrence_date in task.completed_dates:
            occurrence_task.status = TaskStatus.COMPLETED

        occurrences.append(occurrence_task)

    return occurrences