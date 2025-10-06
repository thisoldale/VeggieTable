import re
from playwright.sync_api import sync_playwright, Page, expect

def run_verification(page: Page):
    """
    Verifies the creation and deletion UI for recurring tasks.
    """
    # 1. Navigate directly to the garden plans page to create a new plan
    page.goto("http://localhost:8444/plans")
    page.wait_for_load_state("networkidle")

    # 2. Create a new garden plan for a clean state
    expect(page.get_by_role("heading", name="Create a New Plan")).to_be_visible()
    page.get_by_label("Plan Name").fill("Recurring Task Test Plan")
    page.get_by_role("button", name="Create Plan").click()

    # After creation, app redirects to home page.
    # Wait for the context to update by checking for the plan name in the sidebar.
    page.wait_for_url("**/")
    page.get_by_label("Open menu").click()
    expect(page.get_by_role("heading", name="Recurring Task Test Plan")).to_be_visible(timeout=10000)

    # 3. Navigate to the Tasks page
    page.get_by_role("link", name="Tasks").click()
    page.wait_for_url("**/tasks")
    expect(page.get_by_role("heading", name="Tasks for Recurring Task Test Plan")).to_be_visible(timeout=10000)

    # 4. Open the "Add Task" modal
    page.get_by_role("button", name="Add Task").click()
    expect(page.get_by_role("heading", name="Add New Task")).to_be_visible()

    # 5. Fill in the form for a new recurring task
    page.get_by_label("Task Name").fill("Water the recurring plants")
    page.get_by_label("Start Date").fill("2025-10-06")

    # 6. Enable recurrence and set a rule
    page.get_by_label("This is a recurring task").check()
    expect(page.get_by_text("Repeat every")).to_be_visible()

    # Set to repeat every week on Monday, Wednesday, Friday
    page.get_by_role("button", name="Sun").click()
    page.get_by_role("button", name="Mon").click()
    page.get_by_role("button", name="Wed").click()
    page.get_by_role("button", name="Fri").click()

    # 7. Submit the form
    page.get_by_role("button", name="Add Task").click()

    # 8. Verify the tasks are created and take a screenshot
    expect(page.get_by_text("Water the recurring plants")).to_have_count(3, timeout=10000)
    page.screenshot(path="jules-scratch/verification/creation.png")

    # 9. Open the edit modal for the first instance
    page.get_by_text("Water the recurring plants").first.click()
    expect(page.get_by_role("heading", name="Edit Task")).to_be_visible()

    # 10. Click the delete button
    page.get_by_role("button", name="Delete").click()

    # 11. Verify the delete dialog appears and take a screenshot
    expect(page.get_by_role("heading", name="Delete Recurring Task")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/delete_dialog.png")

    print("Verification script completed successfully!")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        run_verification(page)
        browser.close()

if __name__ == "__main__":
    main()