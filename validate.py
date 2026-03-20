import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/webgl-gray-scott"
SCREENSHOT_DIR = "screenshots"
SCREENSHOT_PATH = os.path.join(SCREENSHOT_DIR, "webgl-gray-scott.png")

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_validation():
    if not os.path.exists(SCREENSHOT_DIR):
        os.makedirs(SCREENSHOT_DIR)

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)

    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    print(f"Serving at port {PORT}")
    time.sleep(1) # wait for server to start

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.goto(f"http://localhost:{PORT}")

            # wait for WebGL context to be ready
            page.wait_for_selector("canvas#glcanvas")
            time.sleep(1)

            # interact with canvas to draw something
            canvas = page.locator("canvas#glcanvas")
            box = canvas.bounding_box()
            x = box["x"] + box["width"] / 2
            y = box["y"] + box["height"] / 2

            # click and drag a bit to spawn some substance B
            page.mouse.move(x, y)
            page.mouse.down()
            page.mouse.move(x + 20, y + 20, steps=5)
            page.mouse.up()

            # wait for some simulation steps to happen and pattern to grow
            time.sleep(3)

            # take a screenshot
            page.screenshot(path=SCREENSHOT_PATH)
            print(f"Screenshot saved to {SCREENSHOT_PATH}")
            browser.close()
    finally:
        httpd.shutdown()
        httpd.server_close()

if __name__ == "__main__":
    run_validation()
