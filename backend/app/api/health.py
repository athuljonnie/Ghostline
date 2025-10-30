"""
Health check endpoints
"""
from fastapi import APIRouter
from app.schemas import HealthResponse
from app.core.config import settings

router = APIRouter()


@router.get("/", response_model=dict)
async def root():
    """Root endpoint"""
    stt_provider = "Deepgram" if settings.STT_PROVIDER == "deepgram" and settings.DEEPGRAM_API_KEY else "Faster-Whisper"
    
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "pipeline": f"Microphone → {stt_provider} → Groq LLM → Google TTS → WebSocket"
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check"""
    # Determine active STT provider
    if settings.STT_PROVIDER == "deepgram" and settings.DEEPGRAM_API_KEY:
        stt_status = f"deepgram-{settings.DEEPGRAM_MODEL}"
    else:
        stt_status = f"faster-whisper-{settings.STT_MODEL}"
    
    return {
        "status": "healthy",
        "components": {
            "fastapi": "running",
            "websocket": "ready",
            "stt": stt_status,
            "llm": settings.LLM_MODEL,
            "tts": "google-tts",
            "database": "postgresql"
        }
    }
