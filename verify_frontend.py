from playwright.sync_api import sync_playwright
import os

def run():
    os.makedirs('screenshots', exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto('http://localhost:8000')

        # Verify overlay
        page.wait_for_selector('#overlay')
        page.screenshot(path='screenshots/audio-reactive-interface.png')

        # Click overlay to dismiss
        page.click('#overlay')
        page.wait_for_selector('#overlay.hidden')

        # Wait a bit for animation
        page.wait_for_timeout(500)

        # Screenshot canvas
        page.screenshot(path='screenshots/audio-reactive-interface-playing.png')

        browser.close()

if __name__ == '__main__':
    run()
