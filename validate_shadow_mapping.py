import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/shadow-mapping-deconstructed"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

if __name__ == "__main__":
    # Start the server in a daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait a bit for the server to start
    time.sleep(2)

    os.makedirs("screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to demo...")
        page.goto(f"http://localhost:{PORT}")

        # Wait for demo to load and render
        page.wait_for_timeout(2000)

        print("Simulating interaction...")
        # Simulate dragging to move the light
        page.mouse.move(500, 300)
        page.mouse.down()
        page.mouse.move(200, 300, steps=10)
        page.wait_for_timeout(500)
        page.mouse.up()

        # Wait a moment for animation to settle
        page.wait_for_timeout(1000)

        print("Taking screenshot...")
        page.screenshot(path="screenshots/shadow-mapping-deconstructed", type="png")
        print("Done!")

        browser.close()
