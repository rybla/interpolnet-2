import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/penrose-tiling-editor"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

time.sleep(1) # wait for server to start

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for canvas to load
    page.wait_for_selector("canvas")

    # Do some zooming
    page.click("#zoom-out")
    page.click("#zoom-out")

    # Do some dragging
    canvas = page.locator("canvas")
    box = canvas.bounding_box()

    # Drag a little from the center to pan
    page.mouse.move(box["width"]/2, box["height"]/2)
    page.mouse.down()
    page.mouse.move(box["width"]/2 + 100, box["height"]/2 + 100)
    page.mouse.up()

    # We don't exactly know where the control points are without complex logic,
    # but we can save a screenshot to verify the tiling renders.

    # Wait a sec for any animations
    page.wait_for_timeout(500)

    os.makedirs("screenshots", exist_ok=True)
    page.screenshot(path="screenshots/penrose-tiling-editor", type="png")

    browser.close()
