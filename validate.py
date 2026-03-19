import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/fibonacci-spiral"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

def run_validation():
    # Start server in background thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(1) # Wait for server to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={'width': 800, 'height': 600})
        page.goto(f"http://localhost:{PORT}/")

        # Wait for the canvas to load
        page.wait_for_selector("canvas")

        # Take a screenshot
        time.sleep(1) # Let some initial drawing happen

        # Click 4 times to generate some squares
        for _ in range(4):
            page.click("canvas")
            time.sleep(0.5)

        os.makedirs("screenshots", exist_ok=True)
        page.screenshot(path="screenshots/fibonacci-spiral.png")
        print("Screenshot saved to screenshots/fibonacci-spiral.png")
        browser.close()

if __name__ == "__main__":
    run_validation()
