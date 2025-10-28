import asyncio
import json
import tempfile
import os
import traceback
from typing import Dict, Optional
from pathlib import Path
import numpy as np

from fastapi import WebSocket, WebSocketDisconnect
from langchain_groq import ChatGroq
# Removed langchain_core.messages import - using simple conversation history
from faster_whisper import WhisperModel
from gtts import gTTS
import soundfile as sf
import yaml
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VoiceAssistantManager:
    """Manages voice assistant sessions with Groq LLM and TTS"""
    
    def __init__(self):
        # Global models (shared across sessions)
        self.stt_model: Optional[WhisperModel] = None
        
        # Session management
        self.active_sessions: Dict[str, dict] = {}
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        
        # Initialize models on first connection
        self._models_loaded = False
    
    async def initialize_models(self):
        """Initialize STT model (TTS uses gTTS online API, no model needed)"""
        if self._models_loaded:
            return
            
        try:
            logger.info("Loading STT model (Faster-Whisper)...")
            self.stt_model = WhisperModel("base", device="cpu", compute_type="int8")
            logger.info("✅ STT model loaded successfully")
            
            logger.info("✅ TTS ready (using Google Text-to-Speech)")
            
            self._models_loaded = True
            
        except Exception as e:
            logger.error(f"❌ Error loading models: {str(e)}")
            raise
    
    async def _download_piper_voice(self) -> str:
        """Download Piper voice model if not exists"""
        # Use a high-quality English voice
        voice_dir = Path("/app/models/piper")
        voice_dir.mkdir(parents=True, exist_ok=True)
        
        voice_file = voice_dir / "en_US-lessac-medium.onnx"
        config_file = voice_dir / "en_US-lessac-medium.onnx.json"
        
        if not voice_file.exists():
            logger.info("Downloading Piper voice model...")
            # In production, download from Piper's official releases
            # For now, we'll use a placeholder - you'll need to add actual download logic
            logger.info("Voice model download would happen here")
            
        return str(voice_file)
    
    def create_session(self, session_id: str, agent_name: str) -> dict:
        """Create a new conversation session"""
        try:
            # Load agent configuration
            agent_config = self._load_agent_config(agent_name)
            
            # Initialize Groq LLM for this session
            llm = ChatGroq(
                groq_api_key=self.groq_api_key,
                model_name="llama-3.1-8b-instant",  # Fast and reliable (replaces llama3-8b-8192)
                temperature=agent_config.get("temperature", 0.7),
                max_tokens=512
            )
            
            # Initialize simple conversation history
            memory = []  # Simple list to store conversation history
            
            # Create session
            session = {
                "agent_name": agent_name,
                "agent_config": agent_config,
                "llm": llm,
                "memory": memory,
                "created_at": asyncio.get_event_loop().time()
            }
            
            self.active_sessions[session_id] = session
            logger.info(f"✅ Created session {session_id} for agent {agent_name}")
            return session
            
        except Exception as e:
            logger.error(f"❌ Error creating session: {str(e)}")
            raise
    
    def _load_agent_config(self, agent_name: str) -> dict:
        """Load agent configuration from YAML file"""
        config_path = Path(f"/app/agents/{agent_name}.yaml")
        
        if not config_path.exists():
            logger.warning(f"Agent config not found: {config_path}")
            return {"system_prompt": "You are a helpful AI assistant.", "temperature": 0.7}
        
        try:
            with open(config_path, 'r') as f:
                config = yaml.safe_load(f)
            return config
        except Exception as e:
            logger.error(f"Error loading agent config: {str(e)}")
            return {"system_prompt": "You are a helpful AI assistant.", "temperature": 0.7}
    
    async def process_audio(self, session_id: str, audio_data: bytes) -> tuple[str, str, bytes]:
        """
        Complete pipeline: Audio → STT → LLM → TTS → Audio
        Returns: (transcription, ai_response_text, audio_bytes)
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        
        try:
            # Step 1: Speech-to-Text
            logger.info(f"🎤 Processing audio for session {session_id}")
            text = await self._transcribe_audio(audio_data)
            logger.info(f"📝 Transcribed: {text}")
            
            if not text.strip():
                empty_msg = "I didn't hear anything. Could you please repeat?"
                empty_audio = await self._generate_audio(empty_msg)
                return "", empty_msg, empty_audio
            
            # Step 2: LLM Processing
            logger.info("🤖 Processing with LLM...")
            ai_response = await self._process_with_llm(session, text)
            logger.info(f"💬 AI Response: {ai_response}")
            
            # Step 3: Text-to-Speech
            logger.info("🔊 Converting to speech...")
            audio_response = await self._generate_audio(ai_response)
            logger.info("✅ Audio generated successfully")
            
            return text, ai_response, audio_response
            
        except Exception as e:
            logger.error(f"❌ Error in audio processing: {str(e)}")
            error_msg = "I'm sorry, I encountered an error processing your request."
            error_audio = await self._generate_audio(error_msg)
            return "", error_msg, error_audio
    
    async def _transcribe_audio(self, audio_data: bytes) -> str:
        """Convert audio bytes to text using Faster-Whisper"""
        try:
            # Save audio to temporary file
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(audio_data)
                temp_path = temp_audio.name
            
            # Transcribe
            segments, info = self.stt_model.transcribe(temp_path, beam_size=5)
            text = " ".join([segment.text for segment in segments])
            
            # Cleanup
            os.unlink(temp_path)
            
            return text.strip()
            
        except Exception as e:
            logger.error(f"STT Error: {str(e)}")
            raise
    
    async def _process_with_llm(self, session: dict, text: str) -> str:
        """Process text with Groq LLM using conversation memory"""
        try:
            llm = session["llm"]
            memory = session["memory"]
            agent_config = session["agent_config"]
            
            # Add system prompt context
            system_prompt = agent_config.get("system_prompt", "You are a helpful AI assistant.")
            
            # Get conversation history
            messages = []
            
            # Add system message
            messages.append({"role": "system", "content": system_prompt})
            
            # Add conversation history from memory (simple list)
            for msg in memory[-20:]:  # Last 20 messages
                messages.append(msg)
            
            # Add current user message
            messages.append({"role": "user", "content": text})
            
            # Get LLM response
            response = await asyncio.get_event_loop().run_in_executor(
                None, lambda: llm.invoke(messages)
            )
            
            ai_response = response.content
            
            # Update memory (simple list)
            memory.append({"role": "user", "content": text})
            memory.append({"role": "assistant", "content": ai_response})
            
            return ai_response
            
        except Exception as e:
            logger.error(f"LLM Error: {str(e)}")
            raise
    
    async def _generate_audio(self, text: str) -> bytes:
        """Convert text to audio using Google Text-to-Speech"""
        try:
            # Create temporary file for audio
            with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_audio:
                temp_path = temp_audio.name
            
            # Generate speech using gTTS
            logger.info(f"🔊 Generating audio for: {text[:50]}...")
            tts = gTTS(text=text, lang='en', slow=False)
            
            # Save to file
            await asyncio.get_event_loop().run_in_executor(
                None, tts.save, temp_path
            )
            
            # Read the generated audio
            with open(temp_path, 'rb') as f:
                audio_bytes = f.read()
            
            # Cleanup
            os.unlink(temp_path)
            
            logger.info(f"✅ Generated {len(audio_bytes)} bytes of audio")
            return audio_bytes
            
        except Exception as e:
            logger.error(f"❌ TTS Error: {str(e)}")
            # Return empty bytes on error
            return b""
    
    def cleanup_session(self, session_id: str):
        """Clean up session resources"""
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
            logger.info(f"🧹 Cleaned up session {session_id}")

# Global manager instance
voice_manager = VoiceAssistantManager()

async def handle_websocket(websocket: WebSocket, agent_name: str):
    """Handle WebSocket connection for voice conversation"""
    session_id = f"{id(websocket)}_{agent_name}"
    
    try:
        # Accept connection
        await websocket.accept()
        logger.info(f"🔗 WebSocket connected for agent: {agent_name}")
        
        # Initialize models if not done
        await voice_manager.initialize_models()
        
        # Create session
        session = voice_manager.create_session(session_id, agent_name)
        
        # Send ready message
        await websocket.send_json({
            "type": "ready", 
            "message": f"Connected to {agent_name}. Ready for voice conversation!"
        })
        
        # Handle messages
        while True:
            try:
                # Receive audio data
                data = await websocket.receive_bytes()
                logger.info(f"📥 Received {len(data)} bytes of audio")
                
                # Process audio through complete pipeline
                transcription, ai_response, response_audio = await voice_manager.process_audio(session_id, data)
                
                # Send transcription first
                if transcription:
                    await websocket.send_json({
                        "type": "transcription",
                        "text": transcription
                    })
                    logger.info(f"📤 Sent transcription: {transcription}")
                
                # Send AI response text
                if ai_response:
                    await websocket.send_json({
                        "type": "response",
                        "text": ai_response
                    })
                    logger.info(f"📤 Sent AI response: {ai_response}")
                
                # Send audio response
                if response_audio:
                    import base64
                    audio_base64 = base64.b64encode(response_audio).decode('utf-8')
                    await websocket.send_json({
                        "type": "audio",
                        "audio": audio_base64
                    })
                    logger.info(f"📤 Sent {len(response_audio)} bytes of audio response")
                
            except WebSocketDisconnect:
                logger.info(f"🔌 WebSocket disconnected for session {session_id}")
                break
            except Exception as e:
                logger.error(f"❌ Error in WebSocket message handling: {str(e)}")
                await websocket.send_json({
                    "type": "error",
                    "message": "An error occurred processing your request."
                })
                
    except Exception as e:
        logger.error(f"❌ WebSocket connection error: {str(e)}")
        logger.error(traceback.format_exc())
    finally:
        # Cleanup
        voice_manager.cleanup_session(session_id)