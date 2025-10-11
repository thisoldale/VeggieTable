from playwright.sync_api import sync_playwright, Page, expect

def verify_recurrence_editor(page: Page):
    """
    This script verifies that the new recurrence editor UI is displayed correctly.
    """
    # 1. Arrange: Go to the application's home page.
    page.goto("http://localhost:8444")

    # 2. Act: Click the "Add New Task" button to open the modal.
    # First, let's create a plan to be able to see the tasks page
    page.get_by_role("button", name="Create New Plan").click()
    page.get_by_label("Plan Name").fill("Test Plan")
    page.get_by_role("button", name="Create Plan").click()

    # Now go to the tasks page
    page.get_by_role("link", name="Tasks").click()

    # Click the "Add New Task" button
    page.get_by_role("button", name="Add New Task").click()

    # 3. Act: Enable the recurrence editor.
    page.get_by_label("This is a recurring task").check()

    # 4. Assert: Check that the recurrence editor is visible.
    expect(page.get_by_text("Repeat every")).to_be_visible()

    # 5. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/recurrence_editor.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        verify_recurrence_editor(page)
        browser.close()

if __name__ == "__main__":
    main()