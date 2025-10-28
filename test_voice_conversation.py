import asyncio
import websockets
import os

async def test_voice_conversation():
    uri = "ws://localhost:8000/ws/assistant"
    audio_file = "backend/test_input.wav"
    response_file = "response.wav"
    
    # Check if audio file exists
    if not os.path.exists(audio_file):
        print(f"❌ Audio file not found: {audio_file}")
        return
        
    print(f"🎤 Using audio file: {audio_file}")
    
    try:
        async with websockets.connect(uri) as websocket:
            print("🔌 Connected to WebSocket!")
            
            # Wait for setup messages
            setup_complete = False
            while not setup_complete:
                try:
                    response = await asyncio.wait_for(websocket.recv(), timeout=60.0)
                    print(f"📋 Server: {response}")
                    
                    if "Ready to receive audio data!" in response:
                        print("✅ WebSocket is ready for audio!")
                        setup_complete = True
                    elif "Error" in response or "not available" in response:
                        print("❌ Server error occurred")
                        return
                        
                except asyncio.TimeoutError:
                    print("⏰ Timeout waiting for setup completion")
                    return
                except websockets.exceptions.ConnectionClosed:
                    print("🔌 Connection closed by server during setup")
                    return
            
            # Send audio file
            print(f"📤 Sending audio file: {audio_file}")
            with open(audio_file, "rb") as f:
                audio_data = f.read()
                await websocket.send(audio_data)
                print(f"📤 Sent {len(audio_data)} bytes of audio data")
            
            # Wait for response
            print("⏳ Waiting for AI response...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=120.0)
                
                if isinstance(response, bytes):
                    # Audio response
                    print(f"🔊 Received audio response: {len(response)} bytes")
                    with open(response_file, "wb") as f:
                        f.write(response)
                    print(f"💾 Saved response to: {response_file}")
                    print("🎉 Voice conversation test completed successfully!")
                    
                elif isinstance(response, str):
                    # Text response (might be an error)
                    print(f"📝 Received text response: {response}")
                else:
                    print(f"❓ Received unknown response type: {type(response)}")
                    
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for AI response (2 minutes)")
            except websockets.exceptions.ConnectionClosed:
                print("🔌 Connection closed while waiting for response")
            
    except Exception as e:
        print(f"❌ Error during voice conversation test: {e}")

if __name__ == "__main__":
    print("🚀 Starting voice conversation test...")
    asyncio.run(test_voice_conversation())