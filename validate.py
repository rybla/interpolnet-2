import os
import time
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/raytracer-pixel-step"
SCREENSHOT_PATH = "screenshots/raytracer-pixel-step"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Ensure screenshots directory exists
os.makedirs("screenshots", exist_ok=True)

# Start server in a background thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Wait for server to start
time.sleep(2)

print("Starting Playwright validation...")
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 800})

    print(f"Navigating to http://localhost:{PORT}")
    page.goto(f"http://localhost:{PORT}")

    # Wait for the demo to load
    page.wait_for_selector("#raytracer-canvas")
    time.sleep(1) # Extra buffer for canvas rendering

    print("Clicking next step multiple times to advance simulation...")
    next_btn = page.locator("#next-step-btn")
    for _ in range(5):
        next_btn.click()
        time.sleep(0.5) # Wait for animation

    print("Taking screenshot...")
    page.screenshot(path=SCREENSHOT_PATH, type="png")

    print("Screenshot saved.")
    browser.close()
