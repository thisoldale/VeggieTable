from playwright.sync_api import sync_playwright, expect
import time

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Generate a unique username and email for each run
    unique_id = str(int(time.time()))
    username = f"testuser_{unique_id}"
    email = f"test_{unique_id}@example.com"

    try:
        # Navigate to the registration page
        page.goto("http://localhost:8444/register")

        # Fill in the registration form with unique credentials
        page.get_by_label("Username").fill(username)
        page.get_by_label("Email").fill(email)
        page.get_by_label("Password").fill("password")

        # Click the register button
        page.get_by_role("button", name="Register").click()

        # Wait for navigation to the login page after registration
        expect(page).to_have_url("http://localhost:8444/login", timeout=10000)

        # Now, log in with the newly created user
        page.get_by_label("Username").fill(username)
        page.get_by_label("Password").fill("password")

        # Click the login button
        page.get_by_role("button", name="Sign In").click()

        # Wait for navigation to the home page and for content to load
        expect(page).to_have_url("http://localhost:8444/", timeout=10000)
        expect(page.get_by_text("Welcome to Your Digital Garden")).to_be_visible(timeout=10000)

        # Take a screenshot after login
        page.screenshot(path="/app/jules-scratch/verification/after_login.png")

        # Reload the page
        page.reload()

        # Wait for the page to fully load after refresh
        expect(page.get_by_role("link", name="Home")).to_be_visible(timeout=10000)
        expect(page.get_by_text("Welcome to Your Digital Garden")).to_be_visible(timeout=10000)

        # Take a screenshot after refresh
        page.screenshot(path="/app/jules-scratch/verification/after_refresh.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)