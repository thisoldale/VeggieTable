import pytest
from playwright.sync_api import Page, expect
import time

def test_add_to_plan_modal_enums(page: Page):
    """
    This test verifies that the 'Planting Method' and 'Harvest Method'
    dropdowns in the 'Add to Plan' modal are correctly populated.
    """
    # 1. Arrange: Go to the application homepage.
    # The dev server is running on port 8444.
    page.goto("http://localhost:8444/plans")

    # 2. Act: Open the 'Add to Plan' modal.
    # Create a new plan
    page.get_by_label("Plan Name").fill("Test Plan")
    page.get_by_role("button", name="Create Plan").click()

    # After creating a plan, we are redirected to the home page.
    # Wait for the home page to load
    expect(page.get_by_role("heading", name="My Garden Plans")).to_be_visible()

    # Navigate to the plant library
    page.goto("http://localhost:8444/bulk-edit")

    # Wait for the add plant button to be visible
    expect(page.get_by_role("button", name="More Actions")).to_be_visible()

    # Add a plant to the library
    page.get_by_role("button", name="More Actions").click()
    page.get_by_role("button", name="Add Row").click()

    # Fill in the new row
    plant_name_input = page.locator('input[value=""]').first
    expect(plant_name_input).to_be_visible()
    plant_name_input.fill("Carrot")

    # Save the new plant
    page.get_by_role("button", name="Save Changes").click()
    expect(page.get_by_text("All changes saved successfully!")).to_be_visible()

    # Select the new row
    page.get_by_test_id("plant-row-1").click()

    # Click the "Add to Plan" button for the new plant
    add_to_plan_button = page.get_by_role("button", name="Add to Plan")
    expect(add_to_plan_button).to_be_enabled()
    add_to_plan_button.click()

    # 3. Assert: Check the dropdown options.
    # Check "Planting Method"
    planting_method_dropdown = page.get_by_label("Planting Method")
    expect(planting_method_dropdown).to_have_value("Seed Starting") # Default value
    # Check that all options are present
    expect(planting_method_dropdown.locator("option")).to_have_count(3)
    expect(page.locator("option[value='Seed Starting']")).to_be_visible()
    expect(page.locator("option[value='Direct Seeding']")).to_be_visible()
    expect(page.locator("option[value='Seedling']")).to_be_visible()

    # Check "Harvest Method"
    harvest_method_dropdown = page.get_by_label("Harvest Method")
    expect(harvest_method_dropdown).to_have_value("Single Harvest") # Default value
    # Check that all options are present
    expect(harvest_method_dropdown.locator("option")).to_have_count(4)
    expect(page.locator("option[value='Single Harvest']")).to_be_visible()
    expect(page.locator("option[value='Cut and Come Again']")).to_be_visible()
    expect(page.locator("option[value='Staggered']")).to_be_visible()
    expect(page.locator("option[value='Continuous']")).to_be_visible()


    # 4. Screenshot: Capture the final result for visual verification.
    page.screenshot(path="jules-scratch/verification/verification.png")

if __name__ == "__main__":
    import subprocess
    subprocess.run(["pytest", __file__])