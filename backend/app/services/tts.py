"""
Text-to-Speech Service
"""
import tempfile
import os
from gtts import gTTS

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class TTSService:
    """Text-to-Speech service using Google TTS"""
    
    def __init__(self):
        self.language = settings.TTS_LANGUAGE
        self.slow = settings.TTS_SLOW
        logger.info("✅ TTS service ready (Google TTS)")
    
    async def generate_audio(self, text: str) -> bytes:
        """
        Convert text to audio
        
        Args:
            text: Text to convert to speech
            
        Returns:
            Audio bytes (MP3 format)
        """
        # Create temporary file
        with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
            temp_path = temp_audio.name
        
        try:
            logger.info(f"Generating audio for: '{text[:50]}...'")
            
            # Generate speech
            tts = gTTS(text=text, lang=self.language, slow=self.slow)
            tts.save(temp_path)
            
            # Read audio bytes
            with open(temp_path, 'rb') as f:
                audio_bytes = f.read()
            
            logger.info(f"✅ Audio generated ({len(audio_bytes)} bytes)")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"❌ TTS generation failed: {e}")
            raise
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)


# Global instance
tts_service = TTSService()
