import os
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

def run_validation():
    # Setup HTTP server pointing to /app/public
    PORT = 8000
    PUBLIC_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "public")

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)

    # Start server in daemon thread
    server_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
    server_thread.start()

    print(f"Serving at port {PORT}")

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Open demo page
        page.goto(f"http://localhost:{PORT}/ik-robotic-arm/")

        # Wait for canvas
        page.wait_for_selector('canvas')
        page.wait_for_timeout(1000) # Give it a second to draw

        # Interact: drag the target
        # Mouse down at initial target pos (center + 150)
        box = page.locator('canvas').bounding_box()
        x = box['x'] + box['width'] / 2 + 150
        y = box['y'] + box['height'] / 2

        page.mouse.move(x, y)
        page.mouse.down()

        # Drag to new position
        page.mouse.move(box['x'] + 100, box['y'] + 100, steps=10)
        page.mouse.up()

        # Wait a bit to ensure rendering
        page.wait_for_timeout(500)

        # Take screenshot
        os.makedirs("screenshots", exist_ok=True)
        screenshot_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "screenshots", "ik-robotic-arm.png")
        page.screenshot(path=screenshot_path)

        print(f"Screenshot saved to {screenshot_path}")

        browser.close()

if __name__ == "__main__":
    run_validation()