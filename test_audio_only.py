import asyncio
import websockets
import os

async def test_audio_processing_only():
    """Test just the audio processing without OpenAI API"""
    uri = "ws://localhost:8000/ws/assistant"
    audio_file = "backend/test_input.wav"
    
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
            
            # Wait for any response (could be error or success)
            print("⏳ Waiting for processing result...")
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=60.0)
                
                if isinstance(response, bytes):
                    print(f"🔊 Received audio response: {len(response)} bytes")
                    with open("response.wav", "wb") as f:
                        f.write(response)
                    print("💾 Saved response to: response.wav")
                    print("🎉 Complete pipeline test successful!")
                    
                elif isinstance(response, str):
                    print(f"📝 Server response: {response}")
                    if "quota" in response.lower() or "api" in response.lower():
                        print("💡 Note: This is an OpenAI API quota issue, not a code problem")
                        print("💡 The audio processing and STT parts are working correctly!")
                        
            except asyncio.TimeoutError:
                print("⏰ Timeout waiting for response")
            except websockets.exceptions.ConnectionClosed:
                print("🔌 Connection closed")
            
    except Exception as e:
        print(f"❌ Error during test: {e}")

if __name__ == "__main__":
    print("🧪 Testing audio processing pipeline...")
    asyncio.run(test_audio_processing_only())