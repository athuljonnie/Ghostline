"""
Speech-to-Text Service
"""
import tempfile
import os
from typing import Optional
from faster_whisper import WhisperModel

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


class STTService:
    """Speech-to-Text service using Faster-Whisper"""
    
    def __init__(self):
        self.model: Optional[WhisperModel] = None
        self._initialized = False
    
    async def initialize(self) -> None:
        """Initialize the STT model"""
        if self._initialized:
            return
        
        try:
            logger.info(f"Loading Whisper model: {settings.STT_MODEL}")
            self.model = WhisperModel(
                settings.STT_MODEL,
                device=settings.STT_DEVICE,
                compute_type=settings.STT_COMPUTE_TYPE
            )
            self._initialized = True
            logger.info("✅ STT model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load STT model: {e}")
            raise
    
    async def transcribe(self, audio_data: bytes) -> str:
        """
        Transcribe audio to text
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            Transcribed text
        """
        if not self._initialized:
            await self.initialize()
        
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_path = temp_audio.name
        
        try:
            logger.info(f"Transcribing audio ({len(audio_data)} bytes)")
            
            # Transcribe
            segments, info = self.model.transcribe(temp_path, beam_size=5,  language="en")
            text = " ".join([segment.text for segment in segments])

            logger.info(f"✅ language=\"en\" '{text[:50]}...'")
            logger.info(f"✅ Transcription complete: '{text[:50]}...'")
            return text.strip()
            
        except Exception as e:
            logger.error(f"❌ Transcription failed: {e}")
            raise
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)


# Global instance
stt_service = STTService()
