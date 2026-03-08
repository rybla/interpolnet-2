import time
import socketserver
import http.server
import threading
from playwright.sync_api import sync_playwright

PORT = 8000

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=".", **kwargs)

class ThreadedTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True

def run_server():
    with ThreadedTCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

def validate():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Open demo
        print("Navigating to demo...")
        page.goto(f"http://localhost:{PORT}/public/minimax-saddle-point-surface/")

        # Wait for canvas to load
        page.wait_for_selector("canvas", state="attached")
        print("Canvas attached.")

        # Wait for 3 seconds to let the ball settle at the saddle point
        page.wait_for_timeout(3000)

        # Take a screenshot
        screenshot_path = "screenshots/minimax-saddle-point-surface.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    validate()
