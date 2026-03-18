import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright
import os

PORT = 8000
DIRECTORY = "public/morph-target-facial-expression-interpolator"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

socketserver.TCPServer.allow_reuse_address = True

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def validate_demo():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Give server time to start
    time.sleep(2)

    # Ensure screenshots dir exists
    os.makedirs("screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for the page/demo to load
        page.wait_for_selector("#canvas-container canvas")

        # Let the animation run to see the morph target
        time.sleep(3)

        # Take a screenshot exactly at the requested path
        screenshot_path = "screenshots/morph-target-facial-expression-interpolator"
        page.screenshot(path=screenshot_path, type="png")
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    validate_demo()
