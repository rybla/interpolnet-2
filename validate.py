import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.serve_forever()

def run_validation():
    # Start the server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait a moment for the server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        page.goto(f"http://localhost:{PORT}/delaunay-circle-mesh-expansion/")

        # Wait for the canvas to load
        page.wait_for_selector("canvas#mesh-canvas")

        # Place several points to form a triangulation
        page.mouse.click(200, 200)
        page.mouse.click(400, 200)
        page.mouse.click(300, 400)
        page.mouse.click(100, 300)
        page.mouse.click(500, 300)

        # Wait for circles to expand and triangles to form
        time.sleep(5)

        # Take a screenshot
        os.makedirs("/app/screenshots", exist_ok=True)
        screenshot_path = "/app/screenshots/delaunay-circle-mesh-expansion.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()