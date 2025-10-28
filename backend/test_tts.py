"""
Simple script to test Google TTS functionality
"""
import asyncio
from gtts import gTTS
import os

async def test_tts():
    """Test Google TTS generation"""
    print("🔊 Testing Google Text-to-Speech...")
    
    test_text = "Hello! This is a test of the Google Text to Speech system. The voice assistant is working correctly."
    
    try:
        # Generate speech
        print(f"📝 Input text: {test_text}")
        tts = gTTS(text=test_text, lang='en', slow=False)
        
        # Save to file
        output_file = "test_output.mp3"
        tts.save(output_file)
        
        # Check file size
        file_size = os.path.getsize(output_file)
        print(f"✅ Audio generated successfully!")
        print(f"📁 Output file: {output_file}")
        print(f"📊 File size: {file_size} bytes")
        
        # Read as bytes (like in the actual handler)
        with open(output_file, 'rb') as f:
            audio_bytes = f.read()
        
        print(f"✅ Audio bytes length: {len(audio_bytes)}")
        print("\n🎉 TTS test passed! You can play 'test_output.mp3' to hear the result.")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(test_tts())
