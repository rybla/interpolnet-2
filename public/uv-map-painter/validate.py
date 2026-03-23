import time
import http.server
import socketserver
import threading
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("Serving at port", PORT)
        httpd.serve_forever()

def run_validation():
    # Start server in background
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()
    time.sleep(2) # Give server time to start

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        page.goto(f"http://localhost:{PORT}/uv-map-painter/index.html")
        page.wait_for_selector("#uv-canvas")
        page.wait_for_selector("#three-container canvas")

        # Wait a bit for Three.js to initialize
        time.sleep(1)

        # Paint on the 2D canvas
        canvas = page.locator("#uv-canvas")
        box = canvas.bounding_box()

        # Draw a line from top-left to bottom-right of the canvas (covers a few faces)
        page.mouse.move(box["x"] + box["width"] * 0.25, box["y"] + box["height"] * 0.25)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] * 0.75, box["y"] + box["height"] * 0.75, steps=10)
        page.mouse.up()

        # Change color and draw another line
        color_picker = page.locator("#color-picker")
        color_picker.fill("#00ffaa")

        page.mouse.move(box["x"] + box["width"] * 0.75, box["y"] + box["height"] * 0.25)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] * 0.25, box["y"] + box["height"] * 0.75, steps=10)
        page.mouse.up()

        # Rotate the 3D cube slightly
        three_canvas = page.locator("#three-container canvas")
        three_box = three_canvas.bounding_box()
        page.mouse.move(three_box["x"] + three_box["width"] * 0.5, three_box["y"] + three_box["height"] * 0.5)
        page.mouse.down()
        page.mouse.move(three_box["x"] + three_box["width"] * 0.2, three_box["y"] + three_box["height"] * 0.5, steps=5)
        page.mouse.up()

        # Wait a bit for the render and rotation to settle
        time.sleep(1)

        # Take a screenshot
        os.makedirs("/app/screenshots", exist_ok=True)
        page.screenshot(path="/app/screenshots/uv-map-painter.png")
        print("Screenshot saved to /app/screenshots/uv-map-painter.png")

        browser.close()

if __name__ == "__main__":
    run_validation()
