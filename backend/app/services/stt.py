"""
Speech-to-Text Service with Deepgram (primary) and Whisper (fallback)
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
    from deepgram import DeepgramClient, PrerecordedOptions, FileSource
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False
    logger.warning("⚠️ Deepgram SDK not installed. Using Whisper only.")


class STTService:
    """
    Speech-to-Text service with multiple providers:
    - Primary: Deepgram (fast, accurate, cloud-based)
    - Fallback: Faster-Whisper (local, reliable)
    """
    
    def __init__(self):
        self.whisper_model: Optional[WhisperModel] = None
        self.deepgram_client: Optional[any] = None
        self._whisper_initialized = False
        self._deepgram_initialized = False
        self._use_deepgram = False
    
    async def initialize(self) -> None:
        """Initialize STT providers"""
        # Try to initialize Deepgram first if configured
        if DEEPGRAM_AVAILABLE and settings.DEEPGRAM_API_KEY and settings.STT_PROVIDER == "deepgram":
            try:
                logger.info("🔵 Initializing Deepgram STT...")
                self.deepgram_client = DeepgramClient(settings.DEEPGRAM_API_KEY)
                self._deepgram_initialized = True
                self._use_deepgram = True
                logger.info(f"✅ Deepgram STT initialized (model: {settings.DEEPGRAM_MODEL})")
                return
            except Exception as e:
                logger.warning(f"⚠️ Deepgram initialization failed: {e}. Falling back to Whisper.")
        
        # Initialize Whisper as fallback or primary
        if not self._whisper_initialized:
            try:
                logger.info(f"🟢 Loading Whisper model: {settings.STT_MODEL}")
                self.whisper_model = WhisperModel(
                    settings.STT_MODEL,
                    device=settings.STT_DEVICE,
                    compute_type=settings.STT_COMPUTE_TYPE
                )
                self._whisper_initialized = True
                self._use_deepgram = False
                logger.info("✅ Whisper STT model loaded successfully")
            except Exception as e:
                logger.error(f"❌ Failed to load Whisper model: {e}")
                raise
    
    async def _transcribe_with_deepgram(self, audio_data: bytes) -> str:
        """Transcribe using Deepgram API"""
        try:
            logger.info(f"🔵 Transcribing with Deepgram ({len(audio_data)} bytes)")
            
            # Prepare audio source
            payload: FileSource = {
                "buffer": audio_data,
            }
            
            # Configure Deepgram options
            options = PrerecordedOptions(
                model=settings.DEEPGRAM_MODEL,
                language=settings.DEEPGRAM_LANGUAGE,
                smart_format=True,
                punctuate=True,
                diarize=False,
            )
            
            # Make API request
            response = self.deepgram_client.listen.rest.v("1").transcribe_file(
                payload, options
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
        Transcribe audio to text with automatic fallback
        
        Strategy:
        1. Try Deepgram if configured and available
        2. Fall back to Whisper if Deepgram fails
        3. Raise error only if both fail
        
        Args:
            audio_data: Raw audio bytes
            
        Returns:
            Transcribed text
        """
        # Ensure at least one provider is initialized
        if not self._deepgram_initialized and not self._whisper_initialized:
            await self.initialize()
        
        # Try Deepgram first if enabled
        if self._use_deepgram and self._deepgram_initialized:
            try:
                return await self._transcribe_with_deepgram(audio_data)
            except Exception as e:
                logger.warning(f"⚠️ Deepgram failed, falling back to Whisper: {e}")
                # Fall through to Whisper fallback
        
        # Use Whisper (either as primary or fallback)
        if self._whisper_initialized:
            return await self._transcribe_with_whisper(audio_data)
        else:
            # Initialize Whisper as emergency fallback
            logger.info("🟡 Initializing Whisper as emergency fallback...")
            await self.initialize()
            return await self._transcribe_with_whisper(audio_data)


# Global instance
stt_service = STTService()
