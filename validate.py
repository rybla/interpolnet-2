import os
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright
import time

PORT = 8000
DIRECTORY = "public/barycentric-rasterization"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Start the server in a daemon thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open the browser window to view the demo
        page.goto(f"http://localhost:{PORT}")

        # Wait for the demo to load and render the initial state
        page.wait_for_selector("#render-canvas")
        time.sleep(2)

        # Interact with the demo: move the mouse to roughly where a vertex is and drag it
        canvas_rect = page.locator("#render-canvas").bounding_box()
        if canvas_rect:
            # Assume one of the vertices is around 50% width and 20% height
            start_x = canvas_rect["x"] + canvas_rect["width"] * 0.5
            start_y = canvas_rect["y"] + canvas_rect["height"] * 0.2

            # Drag the vertex to a new location
            page.mouse.move(start_x, start_y)
            page.mouse.down()

            end_x = canvas_rect["x"] + canvas_rect["width"] * 0.6
            end_y = canvas_rect["y"] + canvas_rect["height"] * 0.5
            page.mouse.move(end_x, end_y, steps=10)

            page.mouse.up()
            page.evaluate("window.dispatchEvent(new MouseEvent('mouseup'))")

        # Wait a bit for the rasterization to progress
        time.sleep(3)

        # Take a screenshot
        os.makedirs("screenshots", exist_ok=True)
        screenshot_path = "screenshots/barycentric-rasterization.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()