from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # 1. Log in
        page.goto("http://localhost:8444/login")
        page.get_by_label("Username").fill("test")
        page.get_by_label("Password").fill("test")
        page.get_by_role("button", name="Login").click()
        expect(page).to_have_url("http://localhost:8444/")

        # 2. Navigate to a plant detail page
        page.goto("http://localhost:8444/plants/1")

        # 3. Verify YieldGraph and take a screenshot
        yield_graph_locator = page.locator('h2:has-text("Weekly Yield Graph") + div')
        expect(yield_graph_locator).to_be_visible()
        page.screenshot(path="jules-scratch/verification/yield-graph.png")

        # 4. Open the YieldGraphModal
        yield_graph_locator.click()

        # 5. Verify YieldGraphModal and take a screenshot
        modal_locator = page.locator('div[role="dialog"]')
        expect(modal_locator).to_be_visible()
        expect(modal_locator.get_by_role("heading", name="Edit Weekly Yield for")).to_be_visible()
        page.screenshot(path="jules-scratch/verification/yield-graph-modal.png")

        print("Verification successful!")

    except Exception as e:
        print(f"An error occurred: {e}")
        page.screenshot(path="jules-scratch/verification/error.png")

    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)