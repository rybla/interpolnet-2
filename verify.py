import os
import sys
import time
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "."

class ThreadingSimpleServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    pass

def start_server():
    os.chdir(DIRECTORY)
    handler = http.server.SimpleHTTPRequestHandler
    httpd = ThreadingSimpleServer(("", PORT), handler)
    print(f"Serving at port {PORT}")
    httpd.serve_forever()

def run_validation():
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give server a moment to start
    time.sleep(1)

    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        demo_url = f"http://localhost:{PORT}/public/galton-board-visualizer/"
        print(f"Navigating to {demo_url}")

        response = page.goto(demo_url, wait_until="networkidle")
        if not response or not response.ok:
            print(f"Failed to load demo. Status: {response.status if response else 'Unknown'}")
            sys.exit(1)

        print("Waiting for balls to fall and accumulate...")
        # Interact with speed to make it fall faster and accumulate
        page.locator("#speed-slider").fill("90")

        # Give simulation time to let some balls stack up
        time.sleep(6)

        # Take a screenshot
        screenshot_dir = "screenshots"
        os.makedirs(screenshot_dir, exist_ok=True)
        screenshot_path = os.path.join(screenshot_dir, "galton-board-visualizer.png")

        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()