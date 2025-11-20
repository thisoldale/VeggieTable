from dateutil.rrule import rrulestr
from datetime import datetime

try:
    print("Testing BYWEEKDAY...")
    rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYWEEKDAY=MO", dtstart=datetime.now())
    print("BYWEEKDAY parsed successfully")
    print(list(rule)[:2])
except Exception as e:
    print(f"BYWEEKDAY failed: {e}")

try:
    print("\nTesting BYDAY...")
    rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO", dtstart=datetime.now())
    print("BYDAY parsed successfully")
    print(list(rule)[:2])
except Exception as e:
    print(f"BYDAY failed: {e}")
