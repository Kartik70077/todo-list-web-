"""
Simple HTTP Server for TaskFlow Todo App
Usage:
    python server.py          (runs on default port 5000)
    python server.py 8080     (runs on custom port 8080)
"""

import sys
import http.server
import socketserver
import webbrowser

DEFAULT_PORT = 5000

def run_server(port=DEFAULT_PORT):
    handler = http.server.SimpleHTTPRequestHandler
    with socketserver.TCPServer(("", port), handler) as httpd:
        url = f"http://localhost:{port}"
        print(f"🚀 TaskFlow Server is running at: {url}")
        print("Press Ctrl+C to stop the server.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PORT
    run_server(port)
