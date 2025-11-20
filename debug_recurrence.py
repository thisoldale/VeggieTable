from datetime import date, datetime, timedelta
from dateutil.rrule import rrulestr, rrule
from typing import List, Optional
from pydantic import BaseModel

# Mocking the Task schema/model
class Task(BaseModel):
    id: int
    title: str
    due_date: date
    recurrence_rule: Optional[str] = None
    exdates: Optional[List[date]] = []
    completed_dates: Optional[List[date]] = []

    class Config:
        from_attributes = True

def get_occurrences(task: Task, start_date: date, end_date: date) -> List[Task]:
    """
    Generates a list of task occurrences for a given recurring task within a date range.
    """
    if not task.recurrence_rule or not task.due_date:
        return [task]

    print(f"Generating occurrences for task '{task.title}'")
    print(f"  Due Date: {task.due_date}")
    print(f"  RRULE: {task.recurrence_rule}")
    print(f"  Range: {start_date} to {end_date}")

    try:
        rule = rrulestr(task.recurrence_rule, dtstart=datetime.combine(task.due_date, datetime.min.time()))
    except Exception as e:
        print(f"  Error parsing RRULE: {e}")
        return [task]
    
    occurrences = []

    # Iterate through occurrences and create virtual tasks
    # Note: In the actual backend, this loop logic is what we want to test
    try:
        between_dates = rule.between(datetime.combine(start_date, datetime.min.time()), datetime.combine(end_date, datetime.max.time()), inc=True)
        print(f"  Found {len(between_dates)} dates in range.")
        for i, occurrence_dt in enumerate(between_dates):
            occurrence_date = occurrence_dt.date()
            print(f"    {i+1}: {occurrence_date}")

            # Skip exdates
            if task.exdates and occurrence_date in task.exdates:
                continue

            # Create a new task instance for the occurrence
            # In the real app, this uses Task.model_validate(task)
            # Here we just copy
            occurrence_task = task.model_copy() 
            occurrence_task.due_date = occurrence_date

            # Set status to COMPLETED if the date is in completed_dates
            # (Skipping status logic for this repro as we just care about generation)

            occurrences.append(occurrence_task)
    except Exception as e:
        print(f"  Error in loop: {e}")
        import traceback
        traceback.print_exc()

    return occurrences

# Test Case
def run_test():
    # Scenario: User creates a task on Nov 26, 2025 (Wednesday)
    # RRULE: Weekly on Wednesday
    # Range: Today (Nov 18, 2025) to +1 year
    
    today = date(2025, 11, 18)
    task_due_date = date(2025, 11, 26)
    
    # RRULE for Weekly on Wednesday. 
    # Note: RecurrenceEditor might generate something like "FREQ=WEEKLY;INTERVAL=1;BYDAY=WE"
    # or "FREQ=WEEKLY;DTSTART=...;..."
    # Let's test a standard one.
    rrule_str = "FREQ=WEEKLY;INTERVAL=1;BYDAY=WE"
    
    task = Task(
        id=1,
        title="Test Recurring Task",
        due_date=task_due_date,
        recurrence_rule=rrule_str
    )

    start_date = today
    end_date = today + timedelta(days=365)

    results = get_occurrences(task, start_date, end_date)
    
    print(f"\nTotal occurrences generated: {len(results)}")
    if len(results) > 1:
        print("SUCCESS: Multiple occurrences generated.")
    else:
        print("FAILURE: Only one (or zero) occurrences generated.")

if __name__ == "__main__":
    run_test()
