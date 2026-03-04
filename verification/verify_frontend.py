import time
import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

PORT = 8000
DIRECTORY = "."

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer(("", PORT), Handler)
    thread = threading.Thread(target=httpd.serve_forever)
    thread.daemon = True
    thread.start()
    return httpd

def validate_demo():
    print("Starting server...")
    httpd = start_server()
    time.sleep(1)

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            demo_url = f"http://localhost:{PORT}/public/interactive-bitwise-logic-gates/"
            print(f"Navigating to {demo_url}...")
            page.goto(demo_url)
            page.wait_for_selector(".panel", timeout=5000)

            print("Taking screenshot at verification/frontend_test.png...")
            page.screenshot(path="verification/frontend_test.png", full_page=True)

            browser.close()
            print("Validation successful!")

    except Exception as e:
        print(f"Validation failed: {e}")
    finally:
        httpd.shutdown()
        httpd.server_close()

if __name__ == "__main__":
    validate_demo()
