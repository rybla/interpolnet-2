import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/perlin-noise-visualizer-2"
SCREENSHOT_PATH = "screenshots/perlin-noise-visualizer-2.png"

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

def run_validation():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open browser window to view demo
        page.goto(f"http://localhost:{PORT}")

        # Wait for demo to load
        page.wait_for_selector("#perlin-canvas")

        # Interact with the demo
        canvas = page.locator("#perlin-canvas")

        # Step 1: Click to show vectors
        canvas.dispatch_event('click')
        time.sleep(1) # wait for render

        # Step 2: Click to show noise
        canvas.dispatch_event('click')
        time.sleep(1) # wait for render

        # Take a screenshot
        page.screenshot(path=SCREENSHOT_PATH, type="png")
        print(f"Screenshot saved to {SCREENSHOT_PATH}")

        browser.close()

run_validation()
