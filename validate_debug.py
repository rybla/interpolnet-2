import http.server
import socketserver
import threading
import os
import time
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "/app/public"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.serve_forever()

def run_validation():
    # Start server in background thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Wait for server to start
    time.sleep(1)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Browser console: {msg.text}"))
        page.on("pageerror", lambda err: print(f"Browser error: {err}"))

        try:
            page.goto(f"http://localhost:{PORT}/procedural-biome-map-generator/")
            page.wait_for_timeout(2000)
        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run_validation()
