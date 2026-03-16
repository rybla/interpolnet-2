import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright
import os

PORT = 8000
DIRECTORY = "public/penrose-tiling-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give the server a moment to start
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})
    page.goto(f"http://localhost:{PORT}")

    # Wait for the canvas and overlay to load
    page.wait_for_selector("#canvas")
    page.wait_for_selector("#ui-overlay")

    # Wait a bit for initial rendering to settle
    time.sleep(2)

    # The canvas should be taking up the full window. The control points are rendered at the center.
    # The center is 1280/2 = 640, 720/2 = 360
    # One of the long edge controls is around (-300, -200) relative to center, which is roughly (340, 160)
    # Let's perform a drag starting near there, moving towards the center.

    # Click near where the top-left long edge control should be
    page.mouse.move(340, 160)
    page.mouse.down()
    page.mouse.move(500, 250, steps=10)
    page.mouse.up()

    # Wait for animation frame to update
    time.sleep(1)

    # Click near where a short edge control should be (e.g. at bottom, y=200 relative to center, x=-185) -> (455, 560)
    page.mouse.move(455, 560)
    page.mouse.down()
    page.mouse.move(500, 500, steps=10)
    page.mouse.up()

    # Wait again
    time.sleep(1)

    # Ensure screenshot directory exists
    os.makedirs("screenshots", exist_ok=True)

    # Take screenshot, using type="png"
    page.screenshot(path="screenshots/penrose-tiling-visualizer", type="png")

    print("Validation script completed successfully.")
    browser.close()
