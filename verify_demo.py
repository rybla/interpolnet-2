
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = context.new_page()

    # Navigate to the demo
    # We are serving the root, so the demo is at /public/nostalgic-os-window-chaos/
    page.goto("http://localhost:8080/public/nostalgic-os-window-chaos/")

    # Wait for the desktop to load
    page.wait_for_selector("#desktop-ui")

    # Check for initial window (Notepad)
    print("Checking for initial Notepad window...")
    notepad = page.wait_for_selector(".window.notepad")
    if notepad:
        print("Initial Notepad window found.")

    # Interact: Open Start Menu and Spawn a new window
    print("Clicking Start Button...")
    page.click("#start-button")

    print("Spawning Critical Error window...")
    page.click(".menu-item:has-text('Critical Error')")

    # Wait for new window
    page.wait_for_selector(".window.error")
    print("Critical Error window spawned.")

    # Interact: Drag the Error window to create trails
    # We need to find the title bar of the error window
    error_window = page.locator(".window.error").first
    title_bar = error_window.locator(".title-bar")

    # Get bounding box to know where to click
    box = title_bar.bounding_box()
    if box:
        print(f"Dragging window from {box['x']}, {box['y']}...")
        page.mouse.move(box['x'] + 10, box['y'] + 10)
        page.mouse.down()

        # Drag in a spiral or circle to show off trails
        import math
        center_x = box['x'] + 10
        center_y = box['y'] + 10
        radius = 100
        steps = 20

        for i in range(steps):
            angle = (i / steps) * 2 * math.pi
            dx = radius * math.cos(angle)
            dy = radius * math.sin(angle)
            page.mouse.move(center_x + dx, center_y + dy)
            # small delay to ensure canvas updates (though playwright is fast)
            page.wait_for_timeout(50)

        page.mouse.up()
        print("Drag complete.")

    # Take screenshot
    screenshot_path = "screenshots/nostalgic-os-window-chaos.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
