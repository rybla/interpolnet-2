import os
import sys
import time
import threading
from http.server import SimpleHTTPRequestHandler, HTTPServer
from playwright.sync_api import sync_playwright

# Define the port and server
PORT = 8000
SERVER_URL = f"http://localhost:{PORT}/public/friction-based-form/"

def run_server():
    """Starts a simple HTTP server in a separate thread."""
    os.chdir('.')  # Ensure we serve from the repo root
    handler = SimpleHTTPRequestHandler
    httpd = HTTPServer(('localhost', PORT), handler)
    httpd.allow_reuse_address = True
    print(f"Serving at {SERVER_URL}")
    httpd.serve_forever()

def verify_demo():
    """Runs Playwright to verify the Friction-Based Form Fields demo."""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print(f"Navigating to {SERVER_URL}...")
        page.goto(SERVER_URL)

        # Wait for the page to load
        page.wait_for_selector('.container')

        # 1. Check initial state (Frozen)
        name_input = page.locator('#name')
        if not name_input.is_disabled():
            print("FAILURE: Name input should be disabled initially.")
            sys.exit(1)

        print("SUCCESS: Name input is initially disabled.")
        page.screenshot(path="screenshots/friction-based-form-frozen.png")

        # 2. Simulate friction (Warming up)
        print("Simulating friction on Name input...")
        # Get bounding box to know where to move mouse
        box = name_input.bounding_box()
        center_x = box['x'] + box['width'] / 2
        center_y = box['y'] + box['height'] / 2

        # Vigorously move mouse back and forth over the input
        page.mouse.move(center_x, center_y)
        for _ in range(50):
            page.mouse.move(center_x - 50, center_y)
            page.mouse.move(center_x + 50, center_y)
            # Small delay to allow JS loop to update temp
            # JS frame rate is ~16ms, so we need enough events
            page.wait_for_timeout(10)

        # 3. Check thawed state
        # Wait a moment for the thaw logic to trigger
        page.wait_for_timeout(500)

        if name_input.is_disabled():
            print("FAILURE: Name input should be enabled after friction.")
            sys.exit(1)

        print("SUCCESS: Name input is enabled after friction.")
        page.screenshot(path="screenshots/friction-based-form-thawed.png")

        # 4. Check cooling (Re-freezing)
        print("Waiting for input to cool down...")
        # Wait enough time for decay (0.5 per frame @ 60fps = 30 temp/sec approx)
        # Thaw threshold is 80, freeze is 60. Max 100.
        # Need to drop below 60.
        page.wait_for_timeout(3000)

        if not name_input.is_disabled():
            print("FAILURE: Name input should re-freeze after inactivity.")
            sys.exit(1)

        print("SUCCESS: Name input re-froze after inactivity.")
        page.screenshot(path="screenshots/friction-based-form-refrozen.png")

        browser.close()

if __name__ == "__main__":
    # Start server in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Give server a moment to start
    time.sleep(2)

    try:
        verify_demo()
        print("Verification passed!")
    except Exception as e:
        print(f"Verification failed: {e}")
        sys.exit(1)
