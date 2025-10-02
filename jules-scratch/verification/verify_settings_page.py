import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Log in directly
        page.goto("http://localhost:8444/login")
        page.get_by_label("Username").fill("testuser")
        page.get_by_label("Password").fill("password123")
        page.get_by_role("button", name="Sign In").click()
        expect(page.get_by_role("button", name="Create a Plan")).to_be_visible()

        # Create a plan to see the calendar
        page.get_by_role("button", name="Create a Plan").click()
        expect(page.get_by_role("heading", name="Garden Plans")).to_be_visible()
        page.get_by_role("button", name="Add New Plan").click()
        page.get_by_label("Plan Name").fill("Test Plan")
        page.get_by_role("button", name="Save").click()
        page.get_by_role("link", name="Test Plan").click()
        page.get_by_role("link", name="Home").click()
        expect(page.get_by_role("heading", name=re.compile(".*"))).to_be_visible()

        # Go to settings and change the day
        page.get_by_role("button", name="Open menu").click()
        page.get_by_role("link", name="Settings").click()
        expect(page.get_by_role("heading", name="Settings")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/settings_page_initial.png")

        # Change to Monday
        page.get_by_label("Start of Week").select_option("1")
        page.screenshot(path="jules-scratch/verification/settings_page_monday.png")

        # Verify on home page
        page.get_by_role("link", name="Home").click()
        expect(page.get_by_text("Mon")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/home_page_monday.png")

        # Change to Wednesday
        page.get_by_role("button", name="Open menu").click()
        page.get_by_role("link", name="Settings").click()
        page.get_by_label("Start of Week").select_option("3")
        page.screenshot(path="jules-scratch/verification/settings_page_wednesday.png")

        # Verify on home page
        page.get_by_role("link", name="Home").click()
        expect(page.get_by_text("Wed")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/home_page_wednesday.png")

        print("Verification successful!")

    finally:
        browser.close()

with sync_playwright() as p:
    run(p)