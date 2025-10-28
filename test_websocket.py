import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:8000/ws/assistant"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected to WebSocket!")
            
            # Wait for welcome messages with longer timeout
            while True:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=30.0)
                    print(f"Received: {response}")
                    
                    if "Ready to receive audio data!" in response:
                        print("✅ WebSocket is ready!")
                        break
                    elif "Error" in response or "not available" in response:
                        print("❌ Error occurred")
                        break
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for message (30s)")
                    break
                except websockets.exceptions.ConnectionClosed:
                    print("🔌 Connection closed by server")
                    break
            
    except Exception as e:
        print(f"❌ Error connecting to WebSocket: {e}")

if __name__ == "__main__":
    asyncio.run(test_websocket())