import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright
import os

PORT = 8000
DIRECTORY = "public/voronoi-sweep-line"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        page.goto(f"http://localhost:{PORT}/")
        page.wait_for_selector("canvas")

        # Add some extra points
        canvas = page.locator("canvas")
        box = canvas.bounding_box()
        page.mouse.click(box["x"] + box["width"] * 0.2, box["y"] + box["height"] * 0.3)
        page.mouse.click(box["x"] + box["width"] * 0.8, box["y"] + box["height"] * 0.7)
        page.mouse.click(box["x"] + box["width"] * 0.5, box["y"] + box["height"] * 0.5)

        # Let the sweep line animate halfway down the screen
        time.sleep(3)

        # Make sure directory exists
        os.makedirs("screenshots", exist_ok=True)

        # Take screenshot
        page.screenshot(path="screenshots/voronoi-sweep-line.png")
        print("Screenshot saved to screenshots/voronoi-sweep-line.png")

        browser.close()

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for server to start
    time.sleep(1)

    run_validation()
