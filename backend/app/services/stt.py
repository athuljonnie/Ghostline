"""
Speech-to-Text Service with Deepgram and Whisper providers
"""
import tempfile
import os
from typing import Optional
from faster_whisper import WhisperModel

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)

# Import Deepgram if available
try:
    from deepgram import DeepgramClient, ListenV1RequestFile
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False
    logger.warning("⚠️ Deepgram SDK not installed. Whisper will be used if selected.")


class STTService:
    """
    Speech-to-Text service with configurable providers:
    - Deepgram (fast, accurate, cloud-based)
    - Whisper (local, reliable)
    
    Provider is strictly determined by settings.STT_PROVIDER
    """
    
    def __init__(self):
        self.whisper_model: Optional[WhisperModel] = None
        self.deepgram_client: Optional[any] = None
        self._initialized = False
        self.provider = settings.STT_PROVIDER
    
    async def initialize(self) -> None:
        """Initialize the configured STT provider"""
        if self._initialized:
            return
        
        if self.provider == "deepgram":
            await self._initialize_deepgram()
        elif self.provider == "whisper":
            await self._initialize_whisper()
        else:
            raise ValueError(f"Unknown STT provider: {self.provider}")
        
        self._initialized = True
    
    async def _initialize_deepgram(self) -> None:
        """Initialize Deepgram STT"""
        if not DEEPGRAM_AVAILABLE:
            raise ImportError(
                "Deepgram SDK is not installed. "
                "Install with: pip install deepgram-sdk"
            )
        
        if not settings.DEEPGRAM_API_KEY:
            raise ValueError(
                "DEEPGRAM_API_KEY is not set. "
                "Please set it in your .env file or environment variables."
            )
        
        try:
            logger.info("🔵 Initializing Deepgram STT...")
            # SDK v5.x uses api_key parameter
            self.deepgram_client = DeepgramClient(api_key=settings.DEEPGRAM_API_KEY)
            logger.info(f"✅ Deepgram STT initialized (model: {settings.DEEPGRAM_MODEL})")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Deepgram: {e}")
            raise
    
    async def _initialize_whisper(self) -> None:
        """Initialize Whisper STT"""
        try:
            logger.info(f"🟢 Loading Whisper model: {settings.STT_MODEL}")
            self.whisper_model = WhisperModel(
                settings.STT_MODEL,
                device=settings.STT_DEVICE,
                compute_type=settings.STT_COMPUTE_TYPE
            )
            logger.info("✅ Whisper STT model loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load Whisper model: {e}")
            raise
    
    async def _transcribe_with_deepgram(self, audio_data: bytes) -> str:
        """Transcribe using Deepgram API"""
        try:
            logger.info(f"🔵 Transcribing with Deepgram ({len(audio_data)} bytes)")
            
            # Make API request using SDK v5.x structure
            # transcribe_file expects 'request' as keyword argument with audio bytes
            response = self.deepgram_client.listen.v1.media.transcribe_file(
                request=audio_data,
                model=settings.DEEPGRAM_MODEL,
                language=settings.DEEPGRAM_LANGUAGE,
                smart_format=True,
                punctuate=True,
                diarize=False,
            )
            
            # Extract transcription
            transcript = response.results.channels[0].alternatives[0].transcript
            
            logger.info(f"✅ Deepgram transcription: '{transcript[:50]}...'")
            return transcript.strip()
            
        except Exception as e:
            logger.error(f"❌ Deepgram transcription failed: {e}")
            raise
    
    async def _transcribe_with_whisper(self, audio_data: bytes) -> str:
        """Transcribe using local Whisper model"""
        # Save audio to temporary file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_path = temp_audio.name
        
        try:
            logger.info(f"🟢 Transcribing with Whisper ({len(audio_data)} bytes)")
            
            # Transcribe
            segments, info = self.whisper_model.transcribe(
                temp_path, 
                beam_size=5, 
                language="en"
            )
            text = " ".join([segment.text for segment in segments])

            logger.info(f"✅ Whisper transcription: '{text[:50]}...'")
            return text.strip()
            
        except Exception as e:
            logger.error(f"❌ Whisper transcription failed: {e}")
            raise
        finally:
            # Cleanup
            if os.path.exists(temp_path):
                os.unlink(temp_path)
    
    async def transcribe(self, audio_data: bytes) -> str:
        """
        Transcribe audio to text using the configured provider
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            Transcribed text
            
        Raises:
            ValueError: If provider is not configured
            Exception: If transcription fails
        """
        # Ensure provider is initialized
        if not self._initialized:
            await self.initialize()
        
        # Use the configured provider (no fallback)
        if self.provider == "deepgram":
            return await self._transcribe_with_deepgram(audio_data)
        elif self.provider == "whisper":
            return await self._transcribe_with_whisper(audio_data)
        else:
            raise ValueError(f"Unknown STT provider: {self.provider}")
    
    def get_provider_info(self) -> dict:
        """Get information about the current STT provider"""
        if self.provider == "deepgram":
            return {
                "provider": "deepgram",
                "model": settings.DEEPGRAM_MODEL,
                "language": settings.DEEPGRAM_LANGUAGE,
                "initialized": self._initialized,
                "available": DEEPGRAM_AVAILABLE,
            }
        elif self.provider == "whisper":
            return {
                "provider": "whisper",
                "model": settings.STT_MODEL,
                "device": settings.STT_DEVICE,
                "compute_type": settings.STT_COMPUTE_TYPE,
                "initialized": self._initialized,
                "available": True,
            }
        else:
            return {
                "provider": self.provider,
                "initialized": False,
                "available": False,
                "error": "Unknown provider"
            }


# Global instance
stt_service = STTService()