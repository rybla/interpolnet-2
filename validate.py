import threading
import http.server
import socketserver
import os
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/barycentric-triangle-fill"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

def run_validation():
    # Start the server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open the demo
        page.goto(f"http://localhost:{PORT}")

        # Wait for demo to load
        page.wait_for_selector('canvas')

        # Interact with the demo (click to start rasterization)
        page.locator('canvas').click(position={"x": 10, "y": 10})

        # Give it some time to rasterize a bit
        time.sleep(2)

        # Ensure the screenshots directory exists
        os.makedirs("screenshots", exist_ok=True)

        # Take a screenshot
        page.screenshot(path="screenshots/barycentric-triangle-fill", type="png")
        print("Screenshot saved to screenshots/barycentric-triangle-fill")

        browser.close()

if __name__ == "__main__":
    run_validation()
