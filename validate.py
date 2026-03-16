import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/turing-patterns-gray-scott"

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
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for canvas to be present
    page.wait_for_selector("canvas#glcanvas")

    # Wait for initial pattern to grow
    time.sleep(2)

    # Interact: Paint across the canvas
    canvas = page.locator("canvas#glcanvas")
    box = canvas.bounding_box()
    if box:
        x, y, w, h = box["x"], box["y"], box["width"], box["height"]
        page.mouse.move(x + w / 4, y + h / 4)
        page.mouse.down()
        # Move in a circle-like path
        page.mouse.move(x + w * 3 / 4, y + h / 4, steps=10)
        page.mouse.move(x + w * 3 / 4, y + h * 3 / 4, steps=10)
        page.mouse.move(x + w / 4, y + h * 3 / 4, steps=10)
        page.mouse.up()

    # Wait for new patterns to grow
    time.sleep(3)

    # Take screenshot, explicitly saving as PNG
    page.screenshot(path="screenshots/turing-patterns-gray-scott", type="png")

    browser.close()
