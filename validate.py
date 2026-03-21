import os
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

def run_validation():
    # Setup HTTP server in background thread
    PORT = 8000
    DIRECTORY = "public/l-system-fractal-trees-editor"

    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=DIRECTORY, **kwargs)

    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)

    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()

            # Navigate to the local server
            page.goto(f"http://localhost:{PORT}")

            # Wait for canvas to be drawn
            page.wait_for_selector('canvas')
            page.wait_for_timeout(500)

            # Interact to change a value (test dragon curve)
            page.fill('#axiom', 'FX')
            page.fill('.rule-key', 'X')
            page.fill('.rule-value', 'X+YF+')

            page.click('#add-rule-btn')
            page.wait_for_timeout(100) # give UI a moment

            # second rule
            rules = page.query_selector_all('.rule-row')
            new_rule = rules[1]
            key_inputs = new_rule.query_selector_all('.rule-key')
            val_inputs = new_rule.query_selector_all('.rule-value')

            key_inputs[0].fill('Y')
            val_inputs[0].fill('-FX-Y')

            # Change angle
            page.fill('#angle', '90')
            page.evaluate('document.getElementById("angle").dispatchEvent(new Event("input"))')

            # Change iterations
            page.fill('#iterations', '6')
            page.evaluate('document.getElementById("iterations").dispatchEvent(new Event("input"))')

            # Wait for drawing
            page.wait_for_timeout(1000)

            # Ensure screenshots directory exists
            os.makedirs("/app/screenshots", exist_ok=True)

            # Take screenshot
            screenshot_path = "/app/screenshots/l-system-fractal-trees-editor.png"
            page.screenshot(path=screenshot_path)

            browser.close()
            print(f"Validation successful, screenshot saved to {screenshot_path}")

    finally:
        httpd.shutdown()

if __name__ == "__main__":
    run_validation()
