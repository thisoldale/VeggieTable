import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Capture all console messages
        page.on("console", lambda msg: print(f"Browser Console: {msg.text}"))

        # Navigate to the web application
        await page.goto("http://172.18.0.3:8444")

        # Keep the script running for a bit to capture any async output
        await asyncio.sleep(5)

        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
