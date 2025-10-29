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
    return {
        "message": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "pipeline": "Microphone → Faster-Whisper → Groq LLM → Google TTS → WebSocket"
    }


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "components": {
            "fastapi": "running",
            "websocket": "ready",
            "stt": f"faster-whisper-{settings.STT_MODEL}",
            "llm": settings.LLM_MODEL,
            "tts": "google-tts",
            "database": "postgresql"
        }
    }
