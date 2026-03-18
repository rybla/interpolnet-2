import threading
import http.server
import socketserver
import os
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/ssao-visualizer"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def main():
    if not os.path.exists("screenshots"):
        os.makedirs("screenshots")

    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for the scene to load
        time.sleep(2)

        # Interact with the demo: click on the canvas
        # Click near the center where the geometry is
        page.mouse.click(400, 300)
        time.sleep(1)

        # Click somewhere else
        page.mouse.click(300, 200)
        time.sleep(1)

        # Save screenshot
        page.screenshot(path="screenshots/ssao-visualizer", type="png")
        print("Screenshot saved to screenshots/ssao-visualizer")

        browser.close()

if __name__ == "__main__":
    main()
