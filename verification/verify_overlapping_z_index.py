import os
import sys
import time
import threading
import http.server
import socketserver
from playwright.sync_api import sync_playwright

# Set up a simple HTTP server to serve the project root
PORT = 8000
Handler = http.server.SimpleHTTPRequestHandler

def start_server():
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving at port {PORT}")
        httpd.serve_forever()

def verify_demo():
    # Start the server in a separate thread
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # Give the server a moment to start
    time.sleep(2)

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        # Navigate to the demo
        url = f"http://localhost:{PORT}/public/overlapping-z-index-puzzle/index.html"
        print(f"Navigating to {url}")

        try:
            response = page.goto(url)
            if response.status != 200:
                print(f"Error: Failed to load page, status code {response.status}")
                sys.exit(1)

            # Check for console errors
            page.on("console", lambda msg: print(f"Console {msg.type}: {msg.text}"))

            # Wait for the page to be fully loaded
            page.wait_for_load_state("networkidle")

            # Check if the title is correct
            title = page.title()
            print(f"Page title: {title}")
            if "Overlapping Z-Index Puzzle" not in title:
                print("Error: Title does not match expected value.")
                sys.exit(1)

            # Interact with the demo: Click Start Button
            print("Clicking Start Button...")
            page.click("#begin-btn")

            # Wait for modals to spawn
            time.sleep(2)

            # Check if modals exist
            modals = page.locator(".modal")
            count = modals.count()
            print(f"Found {count} modals.")
            if count == 0:
                print("Error: No modals spawned after starting game.")
                sys.exit(1)

            # Take a screenshot
            screenshot_path = "screenshots/overlapping-z-index-puzzle.png"
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            page.screenshot(path=screenshot_path)
            print(f"Screenshot saved to {screenshot_path}")

        except Exception as e:
            print(f"An error occurred: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_demo()
