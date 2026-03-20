import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/slope-field-tracer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.serve_forever()

def run_validation():
    # Start the HTTP server in a background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open the demo
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to be present
        canvas = page.locator("#slope-canvas")
        canvas.wait_for()

        # Interact: drop a few ink points
        box = canvas.bounding_box()
        if box:
            x, y = box["x"], box["y"]
            w, h = box["width"], box["height"]

            # Click at some varied positions
            page.mouse.click(x + w * 0.2, y + h * 0.5)
            page.mouse.click(x + w * 0.4, y + h * 0.4)
            page.mouse.click(x + w * 0.5, y + h * 0.6)
            page.mouse.click(x + w * 0.6, y + h * 0.2)
            page.mouse.click(x + w * 0.8, y + h * 0.8)

            # Wait for the animation to trace out curves
            time.sleep(3)

        # Take a screenshot
        page.screenshot(path="screenshots/slope-field-tracer.png")

        browser.close()

if __name__ == "__main__":
    run_validation()
