from playwright.sync_api import sync_playwright, Page, expect

def verify_add_to_plan_modal_layout(page: Page):
    """
    Navigates to the application, opens the Add to Plan modal, and captures a screenshot.
    """
    # 1. Navigate to the application.
    # Using http://frontend:8444 because the script will run inside the backend container
    # and needs to connect to the frontend container over the Docker network.
    page.goto("http://frontend:8444")

    # 2. Wait for the main content to load and click on the first garden plan.
    page.wait_for_selector("text=Your Garden Plans", timeout=15000)

    # Click on the first plan card to navigate to the detail page.
    page.locator('.grid.grid-cols-1.sm\\:grid-cols-2.lg\\:grid-cols-3.gap-4 a').first.click()

    # 3. On the plan detail page, click the "Add Plant" button.
    page.wait_for_selector("text=Add Plant", timeout=10000)
    page.get_by_role("button", name="Add Plant").click()

    # 4. In the plant selection modal, select the first plant.
    page.wait_for_selector("text=Select a Plant to Add", timeout=10000)
    page.locator('.grid.grid-cols-2.sm\\:grid-cols-3.md\\:grid-cols-4.lg\\:grid-cols-5.gap-4 > div').first.click()

    # 5. The "Add to Plan" modal should now be visible.
    # The heading text might vary, so we'll look for a partial match.
    expect(page.locator('h2:has-text("Add")')).to_be_visible(timeout=10000)

    # 6. Take a screenshot of the modal.
    page.screenshot(path="verification.png")

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_add_to_plan_modal_layout(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"An error occurred: {e}")
            page.screenshot(path="error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    main()