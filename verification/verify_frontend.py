import time
import http.server
import socketserver
import threading
import os
from playwright.sync_api import sync_playwright

PORT = 8001
DIRECTORY = "."

socketserver.TCPServer.allow_reuse_address = True

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def run_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

server_thread = threading.Thread(target=run_server, daemon=True)
server_thread.start()
time.sleep(2)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto(f"http://localhost:{PORT}/public/ulam-spiral-visualizer/")

    page.wait_for_selector('canvas#spiral-canvas')

    # Take initial screenshot
    page.screenshot(path='verification/ulam_initial.png')

    # Change equation to n^2 + n + 41 (Euler's prime generating polynomial)
    page.fill('input#coeff-a', '1')
    page.evaluate('document.getElementById("coeff-a").dispatchEvent(new Event("input"))')
    page.fill('input#coeff-b', '1')
    page.evaluate('document.getElementById("coeff-b").dispatchEvent(new Event("input"))')
    page.fill('input#coeff-c', '41')
    page.evaluate('document.getElementById("coeff-c").dispatchEvent(new Event("input"))')

    # Zoom out
    page.fill('input#zoom-slider', '5')
    page.evaluate('document.getElementById("zoom-slider").dispatchEvent(new Event("input"))')

    time.sleep(2)

    page.screenshot(path='verification/ulam_euler_zoomed.png')
    browser.close()
