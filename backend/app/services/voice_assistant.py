"""
Voice Assistant Service - Main orchestration
"""
from typing import Dict, Optional, Tuple
from pathlib import Path
import yaml

from app.core.config import settings
from app.core.logging import get_logger
from app.services.stt import stt_service
from app.services.llm import LLMService
from app.services.tts import tts_service

logger = get_logger(__name__)


class VoiceAssistantService:
    """
    Main voice assistant service that orchestrates STT, LLM, and TTS
    """
    
    def __init__(self):
        self.active_sessions: Dict[str, dict] = {}
        logger.info("✅ Voice Assistant Service initialized")
    
    async def initialize(self) -> None:
        """Initialize all AI models"""
        await stt_service.initialize()
    
    def create_session(self, session_id: str, agent_name: str) -> dict:
        """
        Create a new conversation session
        
        Args:
            session_id: Unique session identifier
            agent_name: Name of the agent to use
            
        Returns:
            Session dictionary
        """
        try:
            # Load agent configuration
            agent_config = self._load_agent_config(agent_name)
            
            # Create LLM instance for this session
            llm_service = LLMService(
                temperature=agent_config.get("temperature", settings.LLM_TEMPERATURE)
            )
            
            # Create session
            session = {
                "agent_name": agent_name,
                "agent_config": agent_config,
                "llm": llm_service,
                "memory": [],  # Conversation history
            }
            
            self.active_sessions[session_id] = session
            logger.info(f"✅ Created session: {session_id} for agent: {agent_name}")
            return session
            
        except Exception as e:
            logger.error(f"❌ Failed to create session: {e}")
            raise
    
    def _load_agent_config(self, agent_name: str) -> dict:
        """
        Load agent configuration from YAML file
        
        Args:
            agent_name: Name of the agent
            
        Returns:
            Agent configuration dictionary
        """
        config_path = Path(f"/app/agents/{agent_name}.yaml")
        
        if not config_path.exists():
            logger.warning(f"Agent config not found: {config_path}, using defaults")
            return {
                "system_prompt": "You are a helpful AI assistant.",
                "temperature": 0.7
            }
        
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            logger.info(f"✅ Loaded agent config: {agent_name}")
            return config
        except Exception as e:
            logger.error(f"❌ Error loading agent config: {e}")
            return {
                "system_prompt": "You are a helpful AI assistant.",
                "temperature": 0.7
            }
    
    async def process_audio(
        self, 
        session_id: str, 
        audio_data: bytes
    ) -> Tuple[str, str, bytes]:
        """
        Complete voice processing pipeline
        
        Args:
            session_id: Session identifier
            audio_data: Raw audio bytes
            
        Returns:
            Tuple of (transcription, ai_response_text, audio_bytes)
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session not found: {session_id}")
        
        try:
            logger.info(f"🎙️ Processing audio for session: {session_id}")
            
            # Step 1: Speech-to-Text
            transcription = await stt_service.transcribe(audio_data)
            
            # Step 2: LLM Processing
            ai_response = await self._process_with_llm(session, transcription)
            
            # Step 3: Text-to-Speech
            response_audio = await tts_service.generate_audio(ai_response)
            
            logger.info(f"✅ Audio processing complete for session: {session_id}")
            return transcription, ai_response, response_audio
            
        except Exception as e:
            logger.error(f"❌ Audio processing failed: {e}")
            raise
    
    async def _process_with_llm(self, session: dict, text: str) -> str:
        """
        Process text with LLM
        
        Args:
            session: Session dictionary
            text: User input text
            
        Returns:
            AI response text
        """
        llm_service: LLMService = session["llm"]
        memory: list = session["memory"]
        system_prompt = session["agent_config"].get("system_prompt")
        
        # Build message context (last N messages)
        messages = memory[-settings.MAX_CONVERSATION_HISTORY:]
        
        # Add current user message
        messages.append({"role": "user", "content": text})
        
        # Generate response
        ai_response = await llm_service.generate_response(messages, system_prompt)
        
        # Update memory
        memory.append({"role": "user", "content": text})
        memory.append({"role": "assistant", "content": ai_response})
        
        return ai_response
    
    def cleanup_session(self, session_id: str) -> None:
        """
        Clean up session resources
        
        Args:
            session_id: Session identifier
        """
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"🧹 Cleaned up session: {session_id}")


# Global instance
voice_assistant_service = VoiceAssistantService()
