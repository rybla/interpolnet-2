import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright
import os

PORT = 8000
DIRECTORY = "public/3d-uv-map-painter"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

# Avoid "Address already in use" errors
socketserver.TCPServer.allow_reuse_address = True

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    # Start server in background
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait a bit for server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to be ready
        page.wait_for_selector("#uv-canvas")
        page.wait_for_selector("#webgl-container canvas")

        # Let threejs initialize
        time.sleep(1)

        # Paint on the canvas
        canvas = page.locator("#uv-canvas")
        box = canvas.bounding_box()

        # Draw a line from top-left to bottom-right
        page.mouse.move(box["x"] + 10, box["y"] + 10)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] - 10, box["y"] + box["height"] - 10, steps=20)
        page.mouse.up()

        # Wait for the texture to sync to the 3D cube
        time.sleep(0.5)

        # Create screenshots directory if it doesn't exist
        os.makedirs("screenshots", exist_ok=True)

        # Save screenshot
        page.screenshot(path="screenshots/3d-uv-map-painter", type="png")

        browser.close()

    print("Validation complete. Screenshot saved.")
