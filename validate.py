import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/single-pixel-raytracer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_validation():
    # Start server
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    thread.start()

    time.sleep(1) # wait for server to start

    print("Server started on port", PORT)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to load
        page.wait_for_selector("canvas")

        print("Page loaded, performing interactions...")

        # Click multiple times to advance the state machine to RESULT
        canvas = page.locator("canvas")
        box = canvas.bounding_box()

        # Click in an empty space to advance state
        click_x = box['x'] + 50
        click_y = box['y'] + 50

        # Advance through all 5 steps to see the final shadow result
        for _ in range(5):
            page.mouse.click(click_x, click_y)
            time.sleep(0.2)

        # Now drag the light source a bit just to test interaction
        # Initially light is at cx + 300, cy - 300
        # For simplicity in this automated test, we'll just take the screenshot

        time.sleep(1) # wait for any rendering

        screenshot_path = "/app/screenshots/single-pixel-raytracer.png"
        import os
        os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

    httpd.shutdown()
    print("Server shutdown.")

if __name__ == "__main__":
    run_validation()
