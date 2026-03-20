import http.server
import socketserver
import threading
from playwright.sync_api import sync_playwright

def run_validation():
    PORT = 8000
    Handler = http.server.SimpleHTTPRequestHandler
    httpd = socketserver.TCPServer(("", PORT), Handler)
    httpd.allow_reuse_address = True

    server_thread = threading.Thread(target=httpd.serve_forever)
    server_thread.daemon = True
    server_thread.start()

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"http://localhost:{PORT}/public/interlocking-penrose-tiling-editor/index.html")
        page.wait_for_timeout(1000)

        # Interact: zoom out, pan, drag a control point
        page.mouse.wheel(0, 100)
        page.wait_for_timeout(500)

        page.mouse.move(400, 300)
        page.mouse.down()
        page.mouse.move(500, 400)
        page.mouse.up()
        page.wait_for_timeout(500)

        # Drag a control point
        page.mouse.move(400, 300) # Assuming the control handles are rendered in the center
        page.mouse.down()
        page.mouse.move(450, 350)
        page.mouse.up()
        page.wait_for_timeout(1000)

        page.screenshot(path="screenshots/interlocking-penrose-tiling-editor.png")
        browser.close()

    httpd.shutdown()
    httpd.server_close()

if __name__ == "__main__":
    run_validation()
