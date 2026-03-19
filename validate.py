import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/interactive-galton-board"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait for the server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_viewport_size({"width": 1280, "height": 720})

        page.goto(f"http://localhost:{PORT}")

        # Wait for demo to load and run for a bit
        time.sleep(3)

        # Skew the probability by clicking on the right side of the canvas
        canvas = page.locator("#canvas")
        box = canvas.bounding_box()

        # Click towards the right side to skew to the right
        page.mouse.click(box["x"] + box["width"] * 0.8, box["y"] + box["height"] * 0.5)

        # Wait for balls to fall and accumulate to show the skewed distribution
        time.sleep(15)

        # Take a screenshot
        page.screenshot(path="/app/screenshots/interactive-galton-board.png")
        print("Screenshot saved to /app/screenshots/interactive-galton-board.png")

        browser.close()

if __name__ == "__main__":
    run_validation()