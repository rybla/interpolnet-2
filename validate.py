import threading
import http.server
import socketserver
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "public/l-system-fractal-trees-generator"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=start_server, daemon=True)
server_thread.start()

# Give server time to start
time.sleep(1)

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}")

    # Wait for the page to load
    page.wait_for_selector('#canvas')

    # Do some interaction
    page.select_option('#preset-select', 'weed')
    time.sleep(0.5) # Wait for render

    page.screenshot(path="screenshots/l-system-fractal-trees-generator.png", type="png")

    browser.close()
