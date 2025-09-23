from playwright.sync_api import Page, expect

def test_plant_library_theme(page: Page):
    """
    This test verifies that the plant library page is affected by the theme.
    """
    # 1. Arrange: Go to the application's homepage.
    page.goto("http://localhost:8444/")

    # Wait for the page to load
    expect(page.get_by_role("heading", name="Garden Planner")).to_be_visible()

    # 2. Act: Open the side menu
    page.get_by_role("button", name="Open menu").click()

    # 3. Act: Click on the "Plant Library" link
    page.get_by_role("link", name="Plant Library").click()

    # Wait for the page to load
    expect(page.get_by_role("heading", name="Bulk Edit Plants")).to_be_visible()

    # 4. Screenshot: Capture the Plant Library page
    page.screenshot(path="jules-scratch/verification/plant-library.png")
