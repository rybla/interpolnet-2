from playwright.sync_api import sync_playwright
import time
import os

def run():
    os.makedirs('screenshots', exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        # Ensure we are serving from repo root so path is correct
        page.goto('http://localhost:8000/public/kinetic-typography-cursor/')

        # Check title
        assert "Kinetic Typography Cursor" in page.title()

        # Check canvas exists
        page.wait_for_selector('#kinetic-canvas')

        # Check UI overlay exists
        page.wait_for_selector('#ui-overlay')
        page.wait_for_selector('#instructions')

        # Take a screenshot
        page.screenshot(path='screenshots/kinetic-typography-cursor.png')

        print("Verification successful!")

        browser.close()

if __name__ == '__main__':
    run()
