"""
Simple HTTP server to serve the frontend
Run: python server.py
Then open: http://localhost:3000
"""
from http.server import HTTPServer, SimpleHTTPRequestHandler
import os

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

if __name__ == '__main__':
    os.chdir(os.path.dirname(__file__))
    port = 3000
    server = HTTPServer(('localhost', port), CORSRequestHandler)
    print(f"🚀 Frontend server running at http://localhost:{port}")
    print(f"📁 Serving files from: {os.getcwd()}")
    print(f"\n✅ Open http://localhost:{port} in your browser")
    print("Press Ctrl+C to stop the server\n")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped")
        server.shutdown()
