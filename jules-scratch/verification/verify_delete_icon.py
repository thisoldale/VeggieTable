from playwright.sync_api import Page, expect

def test_delete_icon_is_visible(page: Page):
    """
    This test verifies that the delete icon on the tasks page is always visible.
    """
    # 1. Arrange: Go to the application and log in.
    page.goto("http://localhost:8444/login")
    page.get_by_label("Email").fill("test@example.com")
    page.get_by_label("Password").fill("password")
    page.get_by_role("button", name="Login").click()

    # Wait for navigation to the home page after login
    expect(page).to_have_url("http://localhost:8444/")

    # 2. Act: Navigate to the Tasks page.
    page.get_by_role("link", name="Tasks").click()
    expect(page).to_have_url("http://localhost:8444/tasks")

    # 3. Assert: Check that the delete icon is visible without any interaction.
    # We'll look for the first task item and its delete button.
    delete_button = page.locator("li.group button").first
    expect(delete_button).to_be_visible()

    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/tasks-page.png")