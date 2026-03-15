import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/slope-field-ink-drops"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

socketserver.TCPServer.allow_reuse_address = True

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Give server time to start
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})

    print("Navigating to demo...")
    page.goto(f"http://localhost:{PORT}")

    # Wait for canvas to load and some initial animation
    page.wait_for_selector("canvas")
    time.sleep(2)

    print("Simulating interactions...")
    # Simulate a drag to drop some ink
    page.mouse.move(300, 300)
    page.mouse.down()
    page.mouse.move(500, 400, steps=10)
    page.mouse.move(700, 200, steps=10)
    page.mouse.up()

    # Wait a bit for the ink to flow
    time.sleep(1.5)

    print("Taking screenshot...")
    os.makedirs("screenshots", exist_ok=True)
    page.screenshot(path="screenshots/slope-field-ink-drops", type="png")

    print("Validation complete.")
    browser.close()
