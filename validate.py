import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public"
import os
import sys
import time
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public"
DIRECTORY = "public/delaunay-triangulation"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.serve_forever()

def run_validation():
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        page.goto(f"http://localhost:{PORT}/inverse-kinematics-arm/")

        # Wait for the canvas to load and be visible
        page.wait_for_selector("canvas")
        time.sleep(1) # Let initial rendering settle

        # Ensure screenshot directory exists
        os.makedirs("/app/screenshots", exist_ok=True)

        # Take an initial screenshot
        # page.screenshot(path="/app/screenshots/inverse-kinematics-arm-initial.png")

        # Interact with the canvas (drag the target point)
        # We can simulate dragging by dispatching pointer events
        canvas = page.locator("canvas")
        box = canvas.bounding_box()

        if box:
            # Move target to top right
            x_start = box["width"] / 2
            y_start = box["height"] / 2

            x_end = box["width"] * 0.8
            y_end = box["height"] * 0.2

            page.mouse.move(x_start, y_start)
            page.mouse.down()
            page.mouse.move(x_end, y_end, steps=10)
            page.mouse.up()

            # Let the arm settle and animation play out
            time.sleep(0.5)

            # Take a final screenshot
            page.screenshot(path="/app/screenshots/inverse-kinematics-arm.png")
            print("Validation complete. Screenshot saved.")
        else:
            print("Failed to find canvas bounding box.")
socketserver.TCPServer.allow_reuse_address = True

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

# Start the server in a separate thread
server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give the server a moment to start
time.sleep(1)

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}/markov-chain-lilypad-frog/")

        # Wait for the page to load and animation to start
        page.wait_for_selector("#pond-canvas", state="attached")
        time.sleep(2) # Give it some time to animate

        os.makedirs("screenshots", exist_ok=True)
        page.screenshot(path="screenshots/markov-chain-lilypad-frog", type="png")

        browser.close()

if __name__ == "__main__":
    run_validation()
    run()
    print("Validation script completed successfully.")
    os._exit(0)
server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()

# Give server a moment to start
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for the canvas to be ready
    canvas = page.locator("#canvas")
    canvas.wait_for()

    # Simulate a user clicking multiple times to create points
    points_to_click = [
        {"x": 200, "y": 200},
        {"x": 600, "y": 200},
        {"x": 400, "y": 400},
        {"x": 300, "y": 600},
        {"x": 700, "y": 600},
        {"x": 100, "y": 500},
        {"x": 500, "y": 100},
        {"x": 800, "y": 300},
    ]

    for point in points_to_click:
        canvas.click(position=point)
        time.sleep(0.3) # Wait a bit between clicks to watch animations

    # Wait for final expanding animations to finish
    time.sleep(2)

    # Save the screenshot explicitly without extension as requested by instructions
    page.screenshot(path="screenshots/delaunay-triangulation", type="png")
    print("Screenshot saved to screenshots/delaunay-triangulation")

    browser.close()