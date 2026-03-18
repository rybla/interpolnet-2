import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/csg-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Start server in background thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give server time to start
time.sleep(2)

def run_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        print("Navigating to demo...")
        page.goto(f"http://localhost:{PORT}/index.html")

        # Wait for the canvas to be created by Three.js
        print("Waiting for canvas...")
        page.wait_for_selector("canvas", timeout=5000)

        # Wait a moment to ensure WebGL context renders the first frame
        time.sleep(1)

        print("Interacting with UI controls...")
        # Change operation to INTERSECTION
        page.check("input[value='INTERSECTION']")
        time.sleep(1)

        # Drag an object across the canvas
        print("Dragging shape...")
        canvas = page.locator("canvas")
        box = canvas.bounding_box()

        # Start dragging from the center (where shapes start)
        start_x = box['x'] + box['width'] / 2
        start_y = box['y'] + box['height'] / 2

        page.mouse.move(start_x, start_y)
        page.mouse.down()

        # Drag it slightly to the left
        page.mouse.move(start_x - 50, start_y)
        page.mouse.up()

        # Allow time for CSG recalculation
        time.sleep(1)

        # Take screenshot
        screenshot_path = "screenshots/csg-visualizer.png"
        print(f"Saving screenshot to {screenshot_path}")

        os.makedirs("screenshots", exist_ok=True)
        page.screenshot(path=screenshot_path)

        print("Validation complete.")
        browser.close()

if __name__ == "__main__":
    run_validation()