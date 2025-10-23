from playwright.sync_api import Page, expect

def test_create_recurring_task(page: Page):
    """
    This test verifies that a user can create a recurring task.
    """
    # 1. Arrange: Go to the tasks page.
    page.goto("http://localhost:8444/")

    # 2. Act: Click the "Add Task" button.
    add_task_button = page.get_by_role("button", name="Add Task")
    add_task_button.click()

    # 3. Act: Fill in the task details.
    page.get_by_label("Task Name").fill("Test Recurring Task")
    page.get_by_label("Description").fill("This is a test recurring task.")
    page.get_by_label("Start Date").fill("2025-10-22")

    # 4. Act: Check the "This is a recurring task" checkbox.
    page.get_by_label("This is a recurring task").check()

    # 5. Assert: Verify that the recurrence editor is visible.
    expect(page.get_by_text("Repeat every")).to_be_visible()

    # 6. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/create-recurring-task.png")
