from playwright.sync_api import sync_playwright, expect
import time
import os

def run(playwright):
    # Clean up database
    if os.path.exists("/tmp/garden_data.db"):
        os.remove("/tmp/garden_data.db")

    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Register a new user
        page.goto("http://localhost:8444/register")
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("password123")
        page.get_by_role("button", name="Register").click()
        expect(page.get_by_role("heading", name="Login")).to_be_visible()

        # 2. Log in
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("password123")
        page.get_by_role("button", name="Sign In").click()
        expect(page.locator(
            'h1:has-text("Welcome to Your Digital Garden")'
        )).to_be_visible()

        # Create a plant in the library
        page.goto("http://localhost:8444/bulk-edit")
        page.get_by_role("button", name="More Actions").click()
        page.get_by_role("button", name="Add Row").click()
        page.locator("tbody tr").first.locator("td").nth(2).locator("input").fill("Tomato")
        page.get_by_role("button", name="Save Changes").click()
        expect(page.get_by_text("All changes saved successfully!")).to_be_visible()
        page.wait_for_timeout(1000)
        expect(page.get_by_role("cell", name="Tomato").first).to_be_visible()

        # Create a plan
        page.goto("http://localhost:8444/plans")
        page.get_by_label("Plan Name").fill("My Test Plan")
        page.get_by_role("button", name="Create Plan").click()
        page.wait_for_url("http://localhost:8444/")

        # Open Add to Plan Modal
        page.goto("http://localhost:8444/")
        page.get_by_role("button", name="Add Task").first.click()
        page.get_by_role("button", name="Direct Seed").click()
        page.get_by_text("Tomato").click()

        # Test date linking in modal
        page.get_by_label("Sow Date").fill("2025-05-01")
        expect(page.get_by_label("Transplant Date")).to_have_value("2025-05-29")
        expect(page.get_by_label("Target Harvest Date")).to_have_value("2025-08-07")
        page.screenshot(path="jules-scratch/verification/modal_date_linking.png")

        # Test validation in modal
        page.get_by_label("Transplant Date").fill("2025-04-01")
        expect(page.get_by_text("Transplant date must be after sow date.")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/modal_validation.png")

        # Fix validation and submit
        page.get_by_label("Sow Date").fill("2025-05-01") # re-trigger calculation
        page.get_by_role("button", name="Add to Plan").click()
        expect(page.get_by_text("Planting added successfully")).to_be_visible()

        # Go to planting detail page
        page.goto("http://localhost:8444/plans/1")
        page.get_by_role("link", name="Tomato").click()

        # Test validation on detail page
        page.get_by_role("button", name="Edit").click()
        page.get_by_label("Transplant Date").fill("2025-04-01")
        page.get_by_role("button", name="Save").click()
        expect(page.get_by_text("Transplant date must be after sow date.")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/detail_page_validation.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
