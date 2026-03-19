import http.server
import socketserver
import threading
import os
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/fibonacci-golden-spiral-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("", PORT), Handler)

thread = threading.Thread(target=httpd.serve_forever)
thread.daemon = True
thread.start()

time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.set_viewport_size({"width": 1280, "height": 720})

    print("Navigating to page...")
    page.goto(f"http://localhost:{PORT}/")

    time.sleep(2) # wait for initial draw

    # Click canvas multiple times to advance animation
    print("Clicking to advance spiral...")
    for _ in range(5):
        page.mouse.click(640, 360)
        time.sleep(1.5) # Wait for animation to finish

    time.sleep(2)

    os.makedirs("screenshots", exist_ok=True)
    screenshot_path = "screenshots/fibonacci-golden-spiral-visualizer.png"
    page.screenshot(path=screenshot_path)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

httpd.shutdown()
httpd.server_close()
