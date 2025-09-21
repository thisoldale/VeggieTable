import re
import random
import string
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Capture console logs
    page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))

    try:
        test_date_calculation(page)
    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

def test_date_calculation(page: Page):
    """
    This test verifies that the date calculation feature works correctly.
    """

    # Generate random username and password
    random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    username = f"testuser_{random_suffix}"
    password = "password123"

    # Register a new user
    print("Navigating to registration page...")
    page.goto("http://localhost:8444/register", timeout=60000)
    print("Registration page loaded.")

    print("Registering new user...")
    page.get_by_label("Username").fill(username)
    page.get_by_label("Password").fill(password)
    page.get_by_role("button", name="Register").click()
    print("User registered.")

    # Log in
    print("Navigating to login page...")
    page.goto("http://localhost:8444/login", timeout=60000)
    print("Login page loaded.")

    print("Logging in...")
    page.get_by_label("Username").fill(username)
    page.get_by_label("Password").fill(password)
    page.get_by_role("button", name="Sign In").click()
    print("Logged in.")

    # Navigate to the planting page
    print("Navigating to the page...")
    page.goto("http://localhost:8444/plantings/1", timeout=60000)
    print("Page loaded.")

    # Wait for the page to load completely
    page.wait_for_selector("text=Edit", timeout=60000)

    # 2. Act: Click the "Edit" button.
    print("Clicking 'Edit' button...")
    edit_button = page.get_by_role("button", name="Edit")
    edit_button.click()
    print("'Edit' button clicked.")

    # 3. Act: Change the "Harvest Date".
    print("Changing 'Harvest Date'...")
    harvest_date_input = page.get_by_label("Harvest Date")
    harvest_date_input.fill("2025-12-31")
    print("'Harvest Date' changed.")

    # 4. Assert: Check that the other dates have been updated.
    # The expected values are calculated based on the plant's data.
    # Amaranth has time_to_maturity: 30-45 days (avg 38) and days_to_transplant: 14-21 (avg 18)
    # Harvest: 2025-12-31
    # Transplant: 2025-12-31 - 38 days = 2025-11-23
    # Sow: 2025-11-23 - 18 days = 2025-11-05
    print("Asserting dates...")
    expect(page.get_by_label("Sow Date")).to_have_value("2025-11-05")
    expect(page.get_by_label("Transplant Date")).to_have_value("2025-11-23")
    print("Date assertions passed.")

    # 5. Screenshot: Capture the final result for visual verification.
    print("Taking screenshot...")
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Screenshot taken.")

    # 6. Act: Change the "Sow Date"
    print("Changing 'Sow Date'...")
    sow_date_input = page.get_by_label("Sow Date")
    sow_date_input.fill("2026-01-01")
    print("'Sow Date' changed.")

    # 7. Assert: Check that the other dates have been updated.
    # Sow: 2026-01-01
    # Transplant: 2026-01-01 + 18 days = 2026-01-19
    # Harvest: 2026-01-19 + 38 days = 2026-02-26
    print("Asserting dates again...")
    expect(page.get_by_label("Transplant Date")).to_have_value("2026-01-19")
    expect(page.get_by_label("Harvest Date")).to_have_value("2026-02-26")
    print("Second date assertions passed.")

    # 8. Screenshot: Capture the final result for visual verification.
    print("Taking second screenshot...")
    page.screenshot(path="jules-scratch/verification/verification.png")
    print("Second screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        run(p)
