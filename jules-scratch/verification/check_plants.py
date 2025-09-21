from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Log in
        page.goto("http://localhost:8444/login")
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("password123")
        page.get_by_role("button", name="Sign In").click()

        # Wait for either the welcome page or the calendar view
        welcome_or_calendar = page.locator(
            'h1:has-text("Welcome to Your Digital Garden"), h2:has-text("Week of")'
        )
        expect(welcome_or_calendar).to_be_visible()

        # Go to plants page
        page.goto("http://localhost:8444/plants")
        page.screenshot(path="jules-scratch/verification/plants_page.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
