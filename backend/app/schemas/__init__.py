"""
Pydantic schemas for request/response validation
"""
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List


class AgentConfig(BaseModel):
    """Agent configuration schema"""
    name: str = Field(..., description="Agent name")
    system_prompt: str = Field(..., description="System prompt for the agent")
    temperature: float = Field(0.7, ge=0.0, le=2.0, description="LLM temperature")
    voice: str = Field("neutral", description="TTS voice style")


class ConversationMessage(BaseModel):
    """Single conversation message"""
    role: str = Field(..., description="Message role: user, assistant, system")
    content: str = Field(..., description="Message content")
    timestamp: Optional[datetime] = None


class TranscriptionResponse(BaseModel):
    """STT transcription response"""
    type: str = "transcription"
    text: str = Field(..., description="Transcribed text")


class AIResponse(BaseModel):
    """LLM response"""
    type: str = "response"
    text: str = Field(..., description="AI response text")


class AudioResponse(BaseModel):
    """TTS audio response"""
    type: str = "audio"
    audio: str = Field(..., description="Base64 encoded audio")


class ErrorResponse(BaseModel):
    """Error response"""
    type: str = "error"
    message: str = Field(..., description="Error message")


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = Field(..., description="Service status")
    components: dict = Field(..., description="Component statuses")


class SessionInfo(BaseModel):
    """Session information"""
    session_id: str
    agent_name: str
    created_at: datetime
    message_count: int
