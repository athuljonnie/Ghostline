# Backend Structure Documentation

## 📁 Project Structure

```
backend/
├── app/                          # Main application package
│   ├── __init__.py              # Package initialization
│   ├── main.py                  # FastAPI application entry point
│   │
│   ├── api/                     # API routes
│   │   ├── __init__.py
│   │   ├── health.py           # Health check endpoints
│   │   └── websocket.py        # WebSocket endpoint
│   │
│   ├── core/                    # Core configuration
│   │   ├── __init__.py
│   │   ├── config.py           # Application settings
│   │   └── logging.py          # Logging configuration
│   │
│   ├── db/                      # Database layer
│   │   ├── __init__.py
│   │   ├── session.py          # Database session management
│   │   └── models.py           # SQLAlchemy models
│   │
│   ├── schemas/                 # Pydantic schemas
│   │   └── __init__.py         # Request/Response models
│   │
│   ├── services/                # Business logic
│   │   ├── __init__.py
│   │   ├── stt.py              # Speech-to-Text service
│   │   ├── llm.py              # Large Language Model service
│   │   ├── tts.py              # Text-to-Speech service
│   │   └── voice_assistant.py  # Main orchestration service
│   │
│   └── utils/                   # Utility functions
│       ├── __init__.py
│       └── helpers.py          # Helper functions
│
├── agents/                      # Agent configurations
│   └── assistant.yaml          # Agent prompts and settings
│
├── models/                      # AI model storage
│   ├── stt_models/             # Speech-to-Text models
│   └── huggingface/            # HuggingFace cache
│
├── logs/                        # Application logs
│   └── app.log                 # Main log file
│
├── requirements.txt             # Python dependencies
├── dockerfile                   # Docker configuration
└── README_STRUCTURE.md         # This file
```

## 🏗️ Architecture Overview

### **Layer Separation**

1. **API Layer** (`app/api/`)
   - HTTP and WebSocket endpoints
   - Request/response handling
   - Route definitions

2. **Service Layer** (`app/services/`)
   - Business logic
   - AI model orchestration
   - Pipeline processing (STT → LLM → TTS)

3. **Data Layer** (`app/db/`)
   - Database models
   - Session management
   - Data persistence

4. **Core Layer** (`app/core/`)
   - Configuration management
   - Logging setup
   - Application-wide settings

5. **Schemas Layer** (`app/schemas/`)
   - Request validation
   - Response serialization
   - Type definitions

6. **Utils Layer** (`app/utils/`)
   - Helper functions
   - Common utilities
   - Shared code

## 🔌 Key Components

### **main.py** - Application Entry Point
- FastAPI app initialization
- CORS middleware setup
- Lifespan events (startup/shutdown)
- Route registration

### **Services**

#### **STTService** (`services/stt.py`)
- Lazy model loading
- Audio transcription
- Temporary file management

#### **LLMService** (`services/llm.py`)
- Groq LLM integration
- Response generation
- Context management

#### **TTSService** (`services/tts.py`)
- Google TTS integration
- Audio generation
- MP3 output

#### **VoiceAssistantService** (`services/voice_assistant.py`)
- Main orchestration
- Session management
- Complete pipeline coordination

## 🚀 Running the Application

### Using Docker:
```bash
docker-compose up --build
```

### Locally:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## 📝 Configuration

All configuration is in `app/core/config.py`:

```python
# AI Models
STT_MODEL = "base"              # Whisper model size
LLM_MODEL = "llama-3.1-8b-instant"  # Groq model
LLM_TEMPERATURE = 0.7           # Creativity level

# Session
MAX_CONVERSATION_HISTORY = 20   # Messages to keep
SESSION_TIMEOUT = 3600          # Seconds
```

Override via environment variables:
```bash
export GROQ_API_KEY="your_key_here"
export STT_MODEL="small"
export DEBUG="True"
```

## 🔄 Request Flow

```
1. Client → WebSocket Connection
   └─> app/api/websocket.py

2. Initialize Session
   └─> app/services/voice_assistant.py
       └─> Load agent config from agents/assistant.yaml

3. Receive Audio
   └─> app/services/voice_assistant.py
       ├─> app/services/stt.py (Transcribe)
       ├─> app/services/llm.py (Generate Response)
       └─> app/services/tts.py (Generate Audio)

4. Send Responses
   ├─> Transcription (JSON)
   ├─> AI Response (JSON)
   └─> Audio (Base64)
```

## 🧪 Testing

```bash
# Test health endpoint
curl http://localhost:8000/health

# Test WebSocket (using websocat)
websocat ws://localhost:8000/ws/assistant
```

## 📊 Logging

Logs are written to:
- Console (stdout)
- File (`/app/logs/app.log`)

Log levels:
- INFO: Normal operations
- WARNING: Important notices
- ERROR: Error conditions
- DEBUG: Detailed debugging (set DEBUG=True)

## 🔒 Security

- API keys stored in environment variables
- CORS configured in settings
- Session isolation per user
- Temporary file cleanup

## 🏆 Best Practices

✅ **Separation of Concerns**: Each module has a single responsibility
✅ **Dependency Injection**: Services injected where needed
✅ **Type Hints**: All functions properly typed
✅ **Async/Await**: Non-blocking operations
✅ **Error Handling**: Try/except with logging
✅ **Configuration**: Environment-based settings
✅ **Documentation**: Docstrings on all functions

## 📚 Adding New Features

### Add a new service:
1. Create `app/services/my_service.py`
2. Export in `app/services/__init__.py`
3. Use in routes or other services

### Add a new endpoint:
1. Create route in `app/api/my_route.py`
2. Include router in `app/api/__init__.py`

### Add a new model:
1. Define in `app/db/models.py`
2. Create migration (if using Alembic)
3. Import in `app/db/__init__.py`

## 🐛 Troubleshooting

**Import errors**: Ensure you're running from the backend directory
**Database errors**: Check DATABASE_URL in config
**Model loading**: Check logs for model initialization
**WebSocket issues**: Verify port 8000 is accessible

## 📖 Additional Resources

- FastAPI: https://fastapi.tiangolo.com/
- Faster-Whisper: https://github.com/guillaumekln/faster-whisper
- LangChain: https://python.langchain.com/
- Groq: https://groq.com/
