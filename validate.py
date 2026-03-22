import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/error-diffusion-dithering"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_validation():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever)
    thread.daemon = True
    thread.start()

    time.sleep(1) # wait for server to spin up

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 800})
        page.goto(f"http://localhost:{PORT}")

        # Wait for everything to load (especially the image and the initial dither to complete)
        page.wait_for_timeout(2000)

        # Interact with the algorithm select
        page.select_option("#algorithm-select", "atkinson")

        # Give it a moment to apply the dithering
        page.wait_for_timeout(1000)

        # Interact with the slider
        canvas_wrapper = page.locator("#canvas-wrapper")
        box = canvas_wrapper.bounding_box()

        # Drag slider slightly to the left
        page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.mouse.down()
        page.mouse.move(box["x"] + box["width"] / 4, box["y"] + box["height"] / 2)
        page.mouse.up()

        # Wait for transition to complete
        page.wait_for_timeout(500)

        # Create screenshots dir if it doesn't exist
        os.makedirs("screenshots", exist_ok=True)

        # Take a screenshot
        page.screenshot(path="screenshots/error-diffusion-dithering.png")

        browser.close()
        httpd.shutdown()

if __name__ == "__main__":
    run_validation()
