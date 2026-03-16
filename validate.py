import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright
import time
import os

PORT = 8000
DIRECTORY = "public/raytracer-single-pixel-calculation"

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

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for the demo to load
    page.wait_for_selector("#raytracer-canvas")

    # Interact: Click 5 times to advance the state machine to RESULT
    for _ in range(5):
        page.locator("#raytracer-canvas").dispatch_event("click")
        time.sleep(1.2) # Wait for each 1-second animation to finish

    # Create screenshots directory if it doesn't exist
    os.makedirs("screenshots", exist_ok=True)

    # Take screenshot
    page.screenshot(path="screenshots/raytracer-single-pixel-calculation", type="png")

    browser.close()

print("Validation script completed successfully.")
