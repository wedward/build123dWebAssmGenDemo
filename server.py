#!/usr/bin/env python3
"""
Simple HTTP server for serving the Python WebAssembly project locally.
This handles CORS properly and provides a convenient way to run the project.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with CORS headers."""
    
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

def main():
    port = 8000
    
    # Try to use a different port if 8000 is busy
    for attempt_port in range(port, port + 10):
        try:
            with socketserver.TCPServer(("", attempt_port), CORSHTTPRequestHandler) as httpd:
                print(f"🚀 Starting Python WebAssembly server...")
                print(f"📡 Server running at: http://localhost:{attempt_port}")
                print(f"📁 Serving files from: {Path.cwd()}")
                print(f"🛑 Press Ctrl+C to stop the server")
                print(f"")
                print(f"🌐 Open your browser and navigate to: http://localhost:{attempt_port}")
                httpd.serve_forever()
        except OSError as e:
            if e.errno == 48:  # Address already in use
                print(f"Port {attempt_port} is busy, trying {attempt_port + 1}...")
                continue
            else:
                raise
    
    print(f"❌ Could not find an available port in range {port}-{port + 9}")
    sys.exit(1)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1) 