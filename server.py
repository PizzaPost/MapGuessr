import asyncio
import websockets
import json
import argparse

# Configuration
DEFAULT_HOST = "0.0.0.0"  # Listen on all network interfaces
DEFAULT_PORT = 8765


class WebSocketServer:
    def __init__(self, host, port):
        self.host = host
        self.port = port
        self.clients = set()

    async def handler(self, websocket):
        """Handle incoming WebSocket connections"""
        
        self.clients.add(websocket)
        print(f"New connection: {websocket.remote_address}")

        try:
            async for message in websocket:
                await self.process_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            print(f"Connection closed: {websocket.remote_address}")
        finally:
            self.clients.remove(websocket)

    async def process_message(self, websocket, message):
        """Process incoming messages"""
        try:
            data = json.loads(message)
            print(f"Received: {data}")

            # Example processing - echo back with timestamp
            response = {
                "original": data,
                "timestamp": asyncio.get_event_loop().time(),
                "status": "received",
            }

            await websocket.send(json.dumps(response))

        except json.JSONDecodeError:
            error_msg = {"error": "Invalid JSON", "received": message}
            await websocket.send(json.dumps(error_msg))

    async def run(self):
        """Start the WebSocket server"""
        server = await websockets.serve(self.handler, self.host, self.port)
        print(f"WebSocket server started on ws://{self.host}:{self.port}")
        await server.wait_closed()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="WebSocket Server")
    parser.add_argument("--host", default=DEFAULT_HOST, help="Host to bind to")
    parser.add_argument(
        "--port", type=int, default=DEFAULT_PORT, help="Port to listen on"
    )
    args = parser.parse_args()

    server = WebSocketServer(args.host, args.port)

    try:
        asyncio.get_event_loop().run_until_complete(server.run())
    except KeyboardInterrupt:
        print("\nServer shutting down...")
