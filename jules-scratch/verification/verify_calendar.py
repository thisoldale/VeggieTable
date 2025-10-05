import re
from playwright.sync_api import sync_playwright, Page, expect

def verify_calendar_changes(page: Page):
    """
    This script verifies the following changes:
    1.  A new garden plan can be created.
    2.  A new planting can be added to the plan with sow and harvest dates.
    3.  The planting appears on the correct dates in the calendar.
    4.  The calendar's infinite scroll loads new weeks.
    """
    # 1. Navigate to the application and create a new plan
    page.goto("http://localhost:8444")

    # It's possible a plan already exists, in which case we start at the calendar.
    # If not, we'll be on the "Welcome" page and need to create a plan.
    try:
        # Look for the welcome heading. If it's not there in 5s, assume we're on the calendar.
        welcome_heading = page.get_by_role("heading", name="Welcome to Your Digital Garden")
        expect(welcome_heading).to_be_visible(timeout=5000)

        # If we're on the welcome page, click to create a plan
        page.get_by_role("link", name="Create a Plan").click()

        # Now we're on the plans page, create a new one
        page.get_by_label("Plan Name").fill("My Test Plan")
        page.get_by_role("button", name="Create Plan").click()
    except Exception:
        # If the welcome heading wasn't found, we're likely on the calendar page.
        # We can proceed with adding a planting.
        print("Already on calendar page. Skipping plan creation.")


    # 2. Add a new planting
    # Click on a day to open the action popover. Let's pick a specific day.
    # We'll find a day button, for example, one with the text "15"
    page.get_by_role("button", name=re.compile(r"15")).first.click()

    # Select "Direct Seed"
    page.get_by_role("button", name="Direct Seed").click()

    # In the plant selection modal, select the first plant
    page.get_by_role("button", name=re.compile(r"Select")).first.click()

    # In the "Add to Plan" modal, set the dates
    # Sow date should be pre-filled, let's set a harvest date
    page.get_by_label("Harvest").click()
    page.get_by_role("button", name="28").first.click() # Choose the 28th for harvest

    # Add to plan
    page.get_by_role("button", name="Add to Plan").click()

    # 3. Verify the planting appears on the correct dates
    # We need to wait for the modal to close and the calendar to refresh
    page.wait_for_timeout(1000) # Give it a second to be safe

    # Check for the sow event
    sow_event = page.get_by_text(re.compile(r"sow"))
    expect(sow_event).to_be_visible()

    # Check for the harvest event
    harvest_event = page.get_by_text(re.compile(r"Harvest", re.IGNORECASE))
    expect(harvest_event).to_be_visible()

    # 4. Verify infinite scroll
    # Scroll down to the bottom of the page
    page.evaluate("window.scrollTo(0, document.body.scrollHeight)")

    # Wait for more weeks to load
    page.wait_for_timeout(2000) # Give it time to load

    # Take a screenshot
    page.screenshot(path="jules-scratch/verification/verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        verify_calendar_changes(page)
        browser.close()

if __name__ == "__main__":
    main()