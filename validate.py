import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def run_validation():
    # Start the server in a daemon thread
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Wait a moment for the server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        page.goto(f"http://localhost:{PORT}/webgl-particle-physics-emitter/")

        # Wait for demo to load
        page.wait_for_selector("canvas#webgl-canvas")
        time.sleep(1) # wait for some particles to spawn

        # Interact with the control panel
        # Change Wind X
        page.fill("input#wind-x", "20")
        page.dispatch_event("input#wind-x", "input")

        # Change Gravity
        page.fill("input#gravity", "10")
        page.dispatch_event("input#gravity", "input")

        # Let the physics update for a moment
        time.sleep(2)

        # Take a screenshot
        page.screenshot(path="/app/screenshots/webgl-particle-physics-emitter.png")

        browser.close()

if __name__ == "__main__":
    run_validation()
