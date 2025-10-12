from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Navigate to the application
        page.goto("http://localhost:8444")

        # Wait for the main content to load
        expect(page.get_by_text("Welcome to your Garden Planner")).to_be_visible(timeout=60000)

        # Create a new plan to ensure the "Add to Plan" button is available
        page.get_by_role("button", name="Create New Plan").click()
        page.get_by_label("Plan Name").fill("Verification Plan")
        page.get_by_role("button", name="Create Plan").click()

        # Wait for the plan to be created and the page to navigate
        expect(page).to_have_url(lambda url: '/garden-plans/' in url, timeout=60000)

        # Click the "Add to Plan" button for the first plant in the list
        page.get_by_role("button", name="Add to Plan").first.click()

        # Wait for the modal to appear
        expect(page.get_by_role("heading", name='Add "Tomato" to Verification Plan')).to_be_visible(timeout=60000)

        # Take a screenshot of the modal
        page.screenshot(path="jules-scratch/verification/verification.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)