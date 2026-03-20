import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright
import time
import os

PORT = 8000
DIRECTORY = "public/huffman-tree-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Ensure screenshots directory exists
    os.makedirs("screenshots", exist_ok=True)

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    time.sleep(1) # Wait for server to start

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Interact with the demo
        page.fill("#text-input", "hello huffman tree world")

        # Give some time for rendering
        time.sleep(1)

        # Take screenshot
        screenshot_path = os.path.abspath("screenshots/huffman-tree-visualizer.png")
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()
