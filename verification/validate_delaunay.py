import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/delaunay-triangulation-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Start server in a separate thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give the server a moment to start
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for the canvas to be present
    canvas = page.locator("#canvas")
    canvas.wait_for()

    # Click multiple times to add points
    bounding_box = canvas.bounding_box()
    if bounding_box:
        w = bounding_box["width"]
        h = bounding_box["height"]

        # Click 5 times at different locations
        points_to_click = [
            (w * 0.2, h * 0.2),
            (w * 0.8, h * 0.2),
            (w * 0.5, h * 0.5),
            (w * 0.2, h * 0.8),
            (w * 0.8, h * 0.8),
        ]

        for (x, y) in points_to_click:
            canvas.click(position={"x": x, "y": y})
            time.sleep(0.5)

    # Wait for animation to draw expanding circles and form triangles
    time.sleep(2)

    # Ensure screenshots directory exists
    os.makedirs("screenshots", exist_ok=True)

    # Take screenshot
    page.screenshot(path="screenshots/delaunay-triangulation-visualizer.png")

    browser.close()

print("Validation complete.")
