from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import logging

from ws_handler import handle_websocket

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Voice Assistant", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "AI Voice Assistant API", 
        "status": "running",
        "pipeline": "Microphone → Faster-Whisper → LangChain+Groq → Google TTS → WebSocket"
    }

@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "components": {
            "fastapi": "running",
            "websocket": "ready",
            "stt": "faster-whisper",
            "llm": "groq-llama-3.1-8b",
            "tts": "google-tts",
            "database": "postgresql"
        }
    }

@app.websocket("/ws/{agent_name}")
async def websocket_endpoint(websocket: WebSocket, agent_name: str):
    """
    WebSocket endpoint for voice conversation
    
    Pipeline: Audio Input → STT → LLM → TTS → Audio Output
    """
    await handle_websocket(websocket, agent_name)

@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("🚀 Starting AI Voice Assistant API")
    logger.info("📋 Pipeline: Microphone → Faster-Whisper → LangChain+Groq → Google TTS → WebSocket")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)