import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/delaunay-triangulation"

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