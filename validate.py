import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/marching-cubes-isosurface"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_validation():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        server_thread = threading.Thread(target=httpd.serve_forever)
        server_thread.daemon = True
        server_thread.start()

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Print console logs and errors for debugging
            page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
            page.on("pageerror", lambda err: print(f"Browser error: {err}"))

            page.goto(f"http://localhost:{PORT}")

            # Wait for canvas to be created
            page.wait_for_selector("canvas", timeout=5000)

            # Give it some time to render
            time.sleep(2)

            # Interact with slider
            slider = page.locator("#threshold-slider")
            slider.fill("75")

            # Give it some time to render after interaction
            time.sleep(1)

            # Take screenshot
            page.screenshot(path="screenshots/marching-cubes-isosurface.png")
            print("Screenshot saved to screenshots/marching-cubes-isosurface.png")

            browser.close()

        httpd.shutdown()

if __name__ == "__main__":
    run_validation()
