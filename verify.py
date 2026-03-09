import os
import time
import threading
from http.server import SimpleHTTPRequestHandler
import socketserver
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public/barycentric-coordinate-rasterization"
SCREENSHOT_PATH = "/app/screenshots/barycentric-coordinate-rasterization"

class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    with ThreadedTCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    # Start server in a background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait a bit for the server to start
    time.sleep(2)

    # Run Playwright validation
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Log console and page errors for debugging
        page.on('console', lambda msg: print(f"Browser console: {msg.text}"))
        page.on('pageerror', lambda exc: print(f"Browser error: {exc}"))

        print("Navigating to page...")
        page.goto(f"http://localhost:{PORT}")

        # Wait for rasterization animation to progress a bit
        print("Waiting for animation...")
        time.sleep(3)

        # Interact with the page (click reset button)
        print("Clicking Reset button to test interaction...")
        page.click("#btn-reset")

        # Wait for it to draw again
        time.sleep(3)

        # Ensure screenshot directory exists
        os.makedirs(os.path.dirname(SCREENSHOT_PATH), exist_ok=True)

        print(f"Taking screenshot to {SCREENSHOT_PATH} ...")
        page.screenshot(path=SCREENSHOT_PATH, type="png")

        browser.close()

    print("Validation script complete.")