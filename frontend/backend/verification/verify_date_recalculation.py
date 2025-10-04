from playwright.sync_api import sync_playwright, Page, expect
import time

def run(page: Page):
    page.goto("http://localhost:8444")

    # Wait for the page to load
    time.sleep(2)

    # Click on the first garden plan if it exists
    if page.locator(".group.cursor-pointer").count() > 0:
        page.locator(".group.cursor-pointer").first.click()
    else:
        # If no garden plan exists, create one
        page.get_by_role("button", name="New Garden Plan").click()
        page.get_by_label("Name").fill("Test Garden Plan")
        page.get_by_role("button", name="Create Plan").click()
        time.sleep(1)
        page.locator(".group.cursor-pointer").first.click()

    # Click on the "Add Plant" button
    page.get_by_role("button", name="Add Plant").click()
    time.sleep(1)

    # Click on the first plant in the library
    page.locator(".p-4.border-b.border-border.cursor-pointer").first.click()
    time.sleep(1)

    # Set sow date
    page.get_by_label("Sow Date").fill("2025-10-01")

    # Change planting method to "Seedling"
    page.get_by_label("Planting Method").select_option("SEEDLING")
    time.sleep(1)

    # Assert that the transplant date is now populated
    expect(page.get_by_label("Transplant Date")).not_to_have_value("")

    # Take a screenshot
    page.screenshot(path="frontend/jules-scratch/verification/verification.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    run(page)
    browser.close()
