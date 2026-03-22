import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright
import time
import os

PORT = 8000
DIRECTORY = "public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    time.sleep(1) # wait for server to start

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}/webgl-particle-physics-emitter/")

        page.wait_for_selector("#ui-canvas")

        # Interact with the vector arrows by clicking and dragging
        ui_canvas = page.locator("#ui-canvas")
        box = ui_canvas.bounding_box()

        # Click center + wind vector offset (100, 0)
        start_x = box["x"] + box["width"] / 2 + 100
        start_y = box["y"] + box["height"] / 2

        page.mouse.move(start_x, start_y)
        page.mouse.down()

        # Drag right
        page.mouse.move(start_x + 100, start_y)
        page.mouse.up()

        # Wait a bit for simulation to run
        time.sleep(2)

        os.makedirs("screenshots", exist_ok=True)
        screenshot_path = os.path.abspath("screenshots/webgl-particle-physics-emitter.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()
