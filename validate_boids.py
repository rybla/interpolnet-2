import threading
import http.server
import socketserver
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/boids-flocking-simulator"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.allow_reuse_address = True
        print("Serving at port", PORT)
        httpd.serve_forever()

def run_validation():
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    time.sleep(2) # Wait for server to start

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}")

        # Wait for canvas to render something
        time.sleep(2)

        # Interact with sliders
        page.fill('#separation', '2')
        page.fill('#alignment', '0')
        page.fill('#cohesion', '0')

        # Wait a bit for the effect to show
        time.sleep(2)

        page.screenshot(path="screenshots/boids-flocking-simulator.png")
        print("Screenshot saved to screenshots/boids-flocking-simulator.png")

        browser.close()

if __name__ == "__main__":
    run_validation()
