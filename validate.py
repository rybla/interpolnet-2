import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/procedural-map-generator"
SCREENSHOT_PATH = "screenshots/procedural-map-generator"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for initial map to render
        time.sleep(2)

        # Click to regenerate the map
        page.click(".canvas-wrapper")
        time.sleep(1)

        # Take a screenshot
        page.screenshot(path=SCREENSHOT_PATH, type="png")
        print(f"Screenshot saved to {SCREENSHOT_PATH}")

        browser.close()
