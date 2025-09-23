from playwright.sync_api import Page, expect

def test_theme_modal_contrast(page: Page):
    """
    This test verifies that the buttons in the "Customize Theme" modal have good contrast.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:8444/")

    # Wait for the page to load
    expect(page.get_by_role("heading", name="Garden Planner")).to_be_visible()

    # 2. Act: Open the side menu
    page.get_by_role("button", name="Open menu").click()

    # 3. Act: Click on the "Customize Theme" button
    page.get_by_role("button", name="Customize Theme").click()

    # Wait for the modal to appear
    expect(page.get_by_role("heading", name="Customize Theme")).to_be_visible()

    # 4. Screenshot: Capture the modal
    page.screenshot(path="jules-scratch/verification/theme-modal.png")
