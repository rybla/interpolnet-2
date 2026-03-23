import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright
import os

PORT = 8000
DIRECTORY = "public/minimax-saddle-settler"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

socketserver.TCPServer.allow_reuse_address = True
httpd = socketserver.TCPServer(("", PORT), Handler)

def start_server():
    httpd.serve_forever()

server_thread = threading.Thread(target=start_server)
server_thread.daemon = True
server_thread.start()

print(f"Serving at port {PORT}")

# Make sure screenshots directory exists
os.makedirs("screenshots", exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for the scene to render
    page.wait_for_timeout(2000)

    # Interact with canvas (drag)
    page.mouse.move(500, 500)
    page.mouse.down()
    page.mouse.move(600, 400, steps=10)
    page.mouse.up()

    # Let animation play to draw trail
    page.wait_for_timeout(2000)

    # Take screenshot, correctly passing type="png" for the extensionless file
    page.screenshot(path="screenshots/minimax-saddle-settler", type="png")

    print("Screenshot taken.")
    browser.close()

httpd.shutdown()
httpd.server_close()
