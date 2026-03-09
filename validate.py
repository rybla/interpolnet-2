import http.server
import socketserver
import threading
import time
import os
import socket
from playwright.sync_api import sync_playwright

def get_free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('localhost', 0))
    port = s.getsockname()[1]
    s.close()
    return port

class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True

def start_server(port):
    handler = http.server.SimpleHTTPRequestHandler
    httpd = ThreadedHTTPServer(("", port), handler)
    print(f"Serving at port {port}")
    httpd.serve_forever()

def validate():
    port = get_free_port()
    server_thread = threading.Thread(target=start_server, args=(port,))
    server_thread.daemon = True
    server_thread.start()

    # Wait for server to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Add error listeners
        page.on("pageerror", lambda exc: print(f"Browser pageerror: {exc}"))
        page.on("console", lambda msg: print(f"Browser console ({msg.type}): {msg.text}"))

        # Navigate to the demo (served from project root)
        page.goto(f"http://localhost:{port}/public/l-system-fractal-trees/")

        # Wait for the canvas to render
        page.wait_for_selector("canvas#tree-canvas")
        time.sleep(2)

        # Interact: Change preset to Dragon Curve
        page.select_option("select#preset-select", "dragon-curve")
        time.sleep(1)

        # Interact: Change iterations
        page.fill("input#iterations-slider", "8")
        page.evaluate("document.getElementById('iterations-slider').dispatchEvent(new Event('input'))")
        time.sleep(1)

        # Interact: Add a rule
        page.click("button#add-rule-btn")
        # Just to trigger re-render
        time.sleep(1)

        # Capture screenshot
        screenshot_path = "screenshots/l-system-fractal-trees.png"
        os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
        page.screenshot(path=screenshot_path)

        browser.close()

if __name__ == "__main__":
    validate()
