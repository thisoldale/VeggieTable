from playwright.sync_api import Page, expect

def test_complete_recurring_task(page: Page):
    """
    This test verifies that a user can complete a recurring task.
    """
    # 1. Arrange: Go to the tasks page.
    page.goto("http://localhost:8444/")

    # 2. Act: Click the checkbox next to the first recurring task.
    #    (Assuming there is at least one recurring task on the page)
    page.locator('.group').first.locator('input[type="checkbox"]').check()

    # 3. Assert: Verify that the task is marked as complete.
    expect(page.locator('.group').first).to_have_class('line-through')

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/complete-recurring-task.png")
