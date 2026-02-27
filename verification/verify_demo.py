from playwright.sync_api import sync_playwright

def verify_gestural_password(page):
    # Navigate to the demo
    page.goto("http://localhost:8080/public/gestural-password-unlock/index.html")

    # Wait for the canvas to be present (3D scene)
    page.wait_for_selector("canvas")

    # Wait for UI overlay elements
    page.wait_for_selector("#hash-value")
    page.wait_for_selector("#mode-set")

    # Take a screenshot of the initial state (Set Password Mode)
    page.screenshot(path="verification/initial_state.png")

    # Click "Unlock" mode
    page.click("#mode-unlock")

    # Wait for visual feedback (e.g., button active state change)
    # The button should get the 'active' class. Let's wait a bit and check if class is applied
    page.wait_for_timeout(1000)

    # Take a screenshot of Unlock Mode
    page.screenshot(path="verification/unlock_mode.png")

    # Check if we can see the canvas content (it might be black if three.js failed)
    # But since we see the UI in the screenshot, the page loaded.
    # The previous screenshot showed black background, which is expected for the scene.
    # We should ensure the cube is visible. The initial screenshot seemed to have a black background.
    # The cube materials are dark grey, so they might blend in if lighting is not strong enough.

    print("Verification screenshots captured.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        try:
            verify_gestural_password(page)
        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()
