"""
Core configuration and settings
"""
import os
from typing import Optional
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "AI Voice Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API Keys
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    DEEPGRAM_API_KEY: Optional[str] = os.getenv("DEEPGRAM_API_KEY", None)
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://aiuser:aipassword@db:5432/aiproject"
    
    # AI Models - STT
    STT_PROVIDER: str = "deepgram"  # "deepgram" or "whisper"
    STT_MODEL: str = "base"  # Whisper model size (fallback)
    STT_DEVICE: str = "cpu"
    STT_COMPUTE_TYPE: str = "int8"
    DEEPGRAM_MODEL: str = "nova-2"  # Deepgram model: nova-2, nova, base, enhanced
    DEEPGRAM_LANGUAGE: str = "en"

# STT_PROVIDER: str = "whisper"
# STT_MODEL: str = "base"
# STT_DEVICE: str = "cpu"
# STT_COMPUTE_TYPE: str = "int8"

    LLM_MODEL: str = "llama-3.1-8b-instant"
    LLM_TEMPERATURE: float = 0.7
    LLM_MAX_TOKENS: int = 512
    
    TTS_LANGUAGE: str = "en"
    TTS_SLOW: bool = False
    
    # Session
    MAX_CONVERSATION_HISTORY: int = 20
    SESSION_TIMEOUT: int = 3600  # seconds
    
    # CORS
    CORS_ORIGINS: list = ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
