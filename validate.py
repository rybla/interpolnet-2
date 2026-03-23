import http.server
import socketserver
import threading
import time
import os
from playwright.sync_api import sync_playwright

def run_server():
    # Serve from the public directory so that the import maps and assets resolve properly.
    Handler = http.server.SimpleHTTPRequestHandler
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
        page.goto('http://localhost:8000/csg-visualizer/index.html')

        # Wait for the scene to load and render
        time.sleep(3)

        # Perform some interaction (drag to move the brush)
        print("Interacting with the demo...")
        container = page.locator('#canvas-container')

        # Select intersection operation
        page.locator('input[value="INTERSECTION"]').check()

        # Simulate dragging the object
        container.hover()
        page.mouse.down()
        page.mouse.move(200, 200, steps=10)
        page.mouse.move(400, 300, steps=10)
        page.mouse.up()

        # Wait a moment to capture the new shapes
        time.sleep(2)

        print("Taking screenshot...")
        os.makedirs('../screenshots', exist_ok=True)
        page.screenshot(path='../screenshots/csg-visualizer.png')

        print("Validation complete.")
        browser.close()

if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public'))
    run_validation()
