import requests

BASE_URL = "http://localhost:8445"

def inspect_tasks():
    # 1. Get the active plan
    plans_resp = requests.get(f"{BASE_URL}/garden-plans/")
    plans = plans_resp.json()
    if not plans:
        print("No garden plans found.")
        return
    
    plan_id = plans[0]['id']
    print(f"Using Plan ID: {plan_id}")

    # 2. Fetch all tasks directly (bypassing the crashing endpoint if possible, but wait, the endpoint IS the one crashing)
    # If the endpoint crashes, I can't use it to inspect.
    # I need to inspect the DB directly or use a different endpoint if available.
    # But wait, I can use the `debug_recurrence.py` approach to connect to DB? 
    # No, `debug_recurrence.py` used Pydantic models, not DB connection.
    
    # Actually, the crash happens in `read_tasks_for_plan_endpoint`.
    # Is there an endpoint to get a SINGLE task?
    # Usually `GET /tasks/{task_id}`.
    
    # Let's try to list tasks one by one if possible, or just assume I need to fix the backend to print the bad task ID before crashing.
    
    # Better plan: Modify backend to print the task ID that is failing.
    pass

if __name__ == "__main__":
    inspect_tasks()
