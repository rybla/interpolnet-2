import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/marching-cubes"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("serving at port", PORT)
        httpd.serve_forever()

# Start server in background thread
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Give server a moment to start
time.sleep(1)

def validate_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to be present
        page.wait_for_selector('canvas')

        # Give Three.js a moment to render the initial frame
        time.sleep(2)

        # Ensure the slider is available
        slider = page.locator('#threshold')
        slider.wait_for()

        # Change the slider value
        slider.fill('0.8')
        slider.evaluate('element => element.dispatchEvent(new Event("input"))')

        # Wait to let the animation catch up
        time.sleep(2)

        # Take a screenshot
        os.makedirs("screenshots", exist_ok=True)
        page.screenshot(path="screenshots/marching-cubes", type="png")
        print("Screenshot saved to screenshots/marching-cubes")

        browser.close()

if __name__ == "__main__":
    validate_demo()
