import time
import threading
import http.server
import socketserver
import os
from playwright.sync_api import sync_playwright

PORT = 8001
DIRECTORY = "public/java-bytecode-vm"

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

def start_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        httpd.serve_forever()

def run_test():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Disable animations
        page.add_init_script("""
            const style = document.createElement('style');
            style.textContent = '* { animation: none !important; transition: none !important; }';
            document.head.appendChild(style);
        """)

        page.goto(f"http://localhost:{PORT}")
        page.wait_for_selector("#btn-step")

        page.select_option("#preset-select", "fibonacci")

        for _ in range(8):
            page.click("#btn-step")
            page.wait_for_timeout(100)

        os.makedirs("verification", exist_ok=True)
        page.screenshot(path="verification/frontend_test.png")
        browser.close()

if __name__ == "__main__":
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()
    time.sleep(1)
    run_test()
