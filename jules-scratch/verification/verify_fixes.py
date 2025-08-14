import time
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    This script verifies the fixes for the following issues:
    1. Login redirect
    2. Task refresh
    3. Plant Library error
    """
    base_url = "http://localhost:8444"

    # 1. Register a new user
    print("Navigating to registration page...")
    page.goto(f"{base_url}/register")

    username = f"testuser_{int(time.time())}"
    password = "password"

    print(f"Registering user: {username}")
    page.get_by_label("Username").fill(username)
    page.get_by_label("Password").fill(password)
    page.get_by_role("button", name="Register").click()

    # Wait for registration to complete and navigate to login page
    expect(page).to_have_url(f"{base_url}/login")
    print("Registration successful, on login page.")

    # 2. Log in and verify redirect
    print("Logging in...")
    page.get_by_label("Username").fill(username)
    page.get_by_label("Password").fill(password)
    page.get_by_role("button", name="Sign In").click()

    # Verify that we are redirected to the home page
    expect(page).to_have_url(f"{base_url}/")
    print("Login successful, redirected to home page.")

    # 3. Create a new garden plan
    print("Creating a new garden plan...")
    page.get_by_role("link", name="Create a Plan").click()
    expect(page).to_have_url(f"{base_url}/plans")

    plan_name = f"Test Plan {int(time.time())}"
    page.get_by_placeholder("New Plan Name").fill(plan_name)
    page.get_by_role("button", name="Create Plan").click()

    # Wait for the plan to be created and set as active
    expect(page.get_by_text(plan_name)).to_be_visible()
    print("Garden plan created.")

    # 4. Add a task and verify it appears on the home page
    print("Adding a new task...")
    page.get_by_role("link", name="Tasks").click()
    expect(page).to_have_url(f"{base_url}/tasks")

    task_name = f"Test Task {int(time.time())}"
    page.get_by_placeholder("e.g., Weed the tomato patch").fill(task_name)
    page.get_by_role("button", name="Add Task").click()

    # Verify the task appears on the tasks page
    expect(page.get_by_text(task_name)).to_be_visible()
    print("Task added successfully.")

    # Navigate to home page and verify the task is there
    print("Navigating to home page to verify task...")
    page.get_by_role("link", name="Home").click()
    expect(page).to_have_url(f"{base_url}/")

    expect(page.get_by_text(task_name)).to_be_visible()
    print("Task is visible on the home page without refresh.")

    # 5. Navigate to Plant Library and verify it loads
    print("Navigating to Plant Library...")
    page.get_by_role("link", name="Plant Library").click()
    expect(page).to_have_url(f"{base_url}/bulk-edit")

    # Verify that the table has loaded by checking for the "Global Search" input
    expect(page.get_by_placeholder("Global Search...")).to_be_visible()
    print("Plant Library loaded successfully.")

    # Take a screenshot of the final state
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Screenshot taken.")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()

if __name__ == "__main__":
    main()
