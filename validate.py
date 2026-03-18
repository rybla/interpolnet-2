import os
import threading
import http.server
import socketserver
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/inverse-kinematics-robotic-arm"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Start the server in a daemon thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give the server a moment to start
time.sleep(1)

# Run Playwright validation
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for canvas to be present
    page.wait_for_selector("canvas")

    # Give it a moment to render
    page.wait_for_timeout(1000)

    # Interact with the canvas (drag)
    canvas = page.locator("canvas")
    box = canvas.bounding_box()

    # Move target
    page.mouse.move(box["x"] + box["width"] / 2 + 100, box["y"] + box["height"] / 2)
    page.mouse.down()
    page.mouse.move(box["x"] + box["width"] / 2 + 100, box["y"] + box["height"] / 2 - 100, steps=10)
    page.mouse.up()

    # Give it a moment to render the new state
    page.wait_for_timeout(1000)

    # Ensure screenshots directory exists
    os.makedirs("screenshots", exist_ok=True)

    # Take screenshot
    page.screenshot(path="screenshots/inverse-kinematics-robotic-arm", type="png")

    browser.close()

print("Validation complete. Screenshot saved.")
