import http.server
import socketserver
import threading
import time
from playwright.sync_api import sync_playwright

def run_server():
    # Serve from the public directory so that the import maps and assets resolve properly.
    # We will access the demo at http://localhost:8000/shadow-mapping
    Handler = http.server.SimpleHTTPRequestHandler

    # allow_reuse_address is True by default for TCPServer if we subclass or just set it
    class MyTCPServer(socketserver.TCPServer):
        allow_reuse_address = True

    with MyTCPServer(("", 8000), Handler) as httpd:
        httpd.serve_forever()

def run_validation():
    print("Starting server...")
    server_thread = threading.Thread(target=run_server, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(2)

    print("Starting Playwright...")
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        page.goto('http://localhost:8000/shadow-mapping/index.html')

        # Wait for the scene to load and render
        time.sleep(3)

        # Perform some interaction (drag to rotate the light source)
        print("Interacting with the demo...")
        container = page.locator('#split-container')

        # Simulate dragging
        container.hover()
        page.mouse.down()
        page.mouse.move(100, 100, steps=10)
        page.mouse.move(200, 50, steps=10)
        page.mouse.up()

        # Wait a moment to capture the new shadows
        time.sleep(2)

        print("Taking screenshot...")
        page.screenshot(path='../screenshots/shadow-mapping.png')

        print("Validation complete.")
        browser.close()

if __name__ == '__main__':
    import os
    os.chdir(os.path.join(os.path.dirname(__file__), 'public'))
    run_validation()
