import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/dithering-algorithm-comparison"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Start server in background
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for server to start
    time.sleep(1)

    os.makedirs("screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to render
        page.wait_for_selector("#dither-canvas")
        time.sleep(1) # wait for initial render

        # Change algorithm to Floyd-Steinberg
        page.click("label[for='alg-floyd']")
        time.sleep(1) # Wait for processing

        # Move the slider
        slider = page.locator("#split-slider")
        slider.fill("75")
        slider.dispatch_event("input")
        time.sleep(1)

        # Take screenshot
        page.screenshot(path="screenshots/dithering-algorithm-comparison", type="png", full_page=True)
        print("Screenshot saved to screenshots/dithering-algorithm-comparison")

        browser.close()

if __name__ == "__main__":
    run_validation()