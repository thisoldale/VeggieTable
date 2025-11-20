from dateutil.rrule import rrulestr

def test_byweekday_parsing():
    try:
        print("Testing BYWEEKDAY...")
        # rrule.js sometimes uses BYWEEKDAY in options, but string is BYDAY.
        # Python dateutil expects BYDAY.
        rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYWEEKDAY=MO")
        print(f"Success BYWEEKDAY: {rule}")
    except Exception as e:
        print(f"Failed BYWEEKDAY: {e}")

    try:
        print("Testing BYDAY...")
        rule = rrulestr("FREQ=WEEKLY;INTERVAL=1;BYDAY=MO")
        print(f"Success BYDAY: {rule}")
    except Exception as e:
        print(f"Failed BYDAY: {e}")

if __name__ == "__main__":
    test_byweekday_parsing()
