import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/minimax-saddle-settler-3d"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Start the server in a daemon thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to be created
        page.wait_for_selector('canvas')

        # Let the animation run for a bit
        time.sleep(2)

        # Simulate interaction
        page.mouse.move(400, 300)
        page.mouse.down()
        page.mouse.move(500, 400, steps=10)
        page.mouse.up()

        # Let the animation settle
        time.sleep(1)

        # Take a screenshot
        screenshot_path = "screenshots/minimax-saddle-settler-3d.png"
        page.screenshot(path=screenshot_path, type="png")
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()
