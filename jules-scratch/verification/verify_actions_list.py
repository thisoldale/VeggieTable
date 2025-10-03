from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # The dev server runs on port 8444 inside the container
        page.goto("http://localhost:8444/")

        # Wait for the main content to load
        page.wait_for_selector('.p-4.md\\:px-8', timeout=30000)

        # The component we changed is CalendarWeek, which has a specific structure
        # Let's find the container for the weekly actions
        actions_container = page.locator('.p-4.bg-secondary').first

        # Wait for the actions to be visible
        expect(actions_container).to_be_visible(timeout=15000)

        # Take a screenshot of the actions container
        screenshot_path = "jules-scratch/verification/weekly-actions.png"
        actions_container.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)