import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/webgl-vector-particle-emitter"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Start server in daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to demo
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to be present
        canvas = page.locator("#overlayCanvas")
        canvas.wait_for()

        # Simulate dragging the gravity vector
        # Origin is at (400, 300). Gravity starts at (400, 400).
        # We will drag it to (500, 450)

        # Trigger mousedown at current gravity head (400, 400)
        canvas.dispatch_event("mousedown", {"clientX": 400, "clientY": 400})

        # Trigger mousemove to new position (500, 450)
        canvas.dispatch_event("mousemove", {"clientX": 500, "clientY": 450})

        # Trigger mouseup
        page.evaluate("window.dispatchEvent(new MouseEvent('mouseup'))")

        # Let particles simulate for a few seconds
        time.sleep(3)

        # Take screenshot
        os.makedirs("screenshots", exist_ok=True)
        page.screenshot(path="screenshots/webgl-vector-particle-emitter", type="png")

        print("Screenshot saved to screenshots/webgl-vector-particle-emitter")

        browser.close()

if __name__ == "__main__":
    run_validation()
