"""
WebSocket endpoint for voice conversation
"""
import base64
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.logging import get_logger
from app.services import voice_assistant_service
from app.schemas import TranscriptionResponse, AIResponse, AudioResponse, ErrorResponse

logger = get_logger(__name__)

router = APIRouter()


@router.websocket("/ws/{agent_name}")
async def websocket_endpoint(websocket: WebSocket, agent_name: str):
    """
    WebSocket endpoint for voice conversation
    
    Args:
        websocket: WebSocket connection
        agent_name: Name of the agent to use
    """
    session_id = f"{id(websocket)}_{agent_name}"
    
    try:
        # Accept connection
        await websocket.accept()
        logger.info(f"🔗 WebSocket connected: {agent_name} (session: {session_id})")
        
        # Initialize models
        await voice_assistant_service.initialize()
        
        # Create session
        session = voice_assistant_service.create_session(session_id, agent_name)
        
        # Send ready message
        await websocket.send_json({
            "type": "ready",
            "message": f"Connected to {agent_name}. Ready to assist!"
        })
        
        # Message loop
        while True:
            # Receive audio data
            data = await websocket.receive_bytes()
            logger.info(f"📥 Received {len(data)} bytes from {session_id}")
            
            try:
                # Process through pipeline
                transcription, ai_response, response_audio = await voice_assistant_service.process_audio(
                    session_id, 
                    data
                )
                
                # Send transcription
                await websocket.send_json(
                    TranscriptionResponse(text=transcription).dict()
                )
                logger.info(f"📤 Sent transcription: '{transcription}'")
                
                # Send AI response text
                await websocket.send_json(
                    AIResponse(text=ai_response).dict()
                )
                logger.info(f"📤 Sent AI response: '{ai_response[:50]}...'")
                
                # Send audio
                audio_base64 = base64.b64encode(response_audio).decode('utf-8')
                await websocket.send_json(
                    AudioResponse(audio=audio_base64).dict()
                )
                logger.info(f"📤 Sent audio ({len(response_audio)} bytes)")
                
            except Exception as e:
                logger.error(f"❌ Error processing audio: {e}")
                await websocket.send_json(
                    ErrorResponse(message=str(e)).dict()
                )
    
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket disconnected: {session_id}")
    
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    
    finally:
        # Cleanup
        voice_assistant_service.cleanup_session(session_id)
        logger.info(f"🧹 Session cleaned up: {session_id}")
