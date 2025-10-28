import asyncio
import websockets
import json
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_voice_conversation():
    """Test the complete voice conversation pipeline"""
    uri = "ws://localhost:8000/ws/assistant"
    
    try:
        async with websockets.connect(uri) as websocket:
            logger.info("🔗 Connected to voice assistant")
            
            # Wait for ready message
            ready_msg = await websocket.recv()
            if isinstance(ready_msg, str):
                data = json.loads(ready_msg)
                logger.info(f"📢 Server: {data.get('message')}")
            
            # Load test audio file
            audio_file = Path("test_input.wav")
            if not audio_file.exists():
                logger.error("❌ test_input.wav not found")
                return
            
            # Send audio
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            logger.info(f"🎤 Sending {len(audio_data)} bytes of audio...")
            await websocket.send(audio_data)
            
            # Receive response
            logger.info("⏳ Waiting for AI response...")
            response_audio = await websocket.recv()
            
            if isinstance(response_audio, bytes):
                # Save response audio
                with open("ai_response.wav", 'wb') as f:
                    f.write(response_audio)
                logger.info(f"🔊 Received {len(response_audio)} bytes of audio response")
                logger.info("💾 Saved as ai_response.wav")
            else:
                logger.info(f"📝 Text response: {response_audio}")
                
    except Exception as e:
        logger.error(f"❌ Error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_voice_conversation())