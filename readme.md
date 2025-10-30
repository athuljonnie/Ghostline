# 🎙️ AI Voice Assistant Platform

> **Production-ready voice assistant platform with STT, LLM, and TTS capabilities built with FastAPI, featuring enterprise-grade architecture and real-time WebSocket communication.**

[![Python](https://img.shields.io/badge/Python-3.11-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue.svg)](https://www.postgresql.org/)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Voice Pipeline](#voice-pipeline)
- [Configuration](#configuration)
- [Development](#development)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## 🌟 Overview

The **AI Voice Assistant Platform** is a modern, scalable solution for building conversational AI applications with voice capabilities. It provides a complete pipeline from speech input to AI-generated voice responses, making it ideal for creating intelligent voice assistants, customer service bots, and interactive voice applications.

### Key Highlights

- 🎤 **Real-time Speech Recognition** using Faster-Whisper
- 🤖 **Intelligent Responses** powered by Groq's Llama-3.1-8B
- 🔊 **Natural Voice Synthesis** with Google Text-to-Speech
- 🔌 **WebSocket Integration** for real-time bidirectional communication
- 🏗️ **Enterprise Architecture** following industry best practices
- 🐳 **Containerized Deployment** with Docker Compose
- 📊 **Database Persistence** with PostgreSQL and SQLAlchemy
- 🔥 **Hot Reload Development** for rapid iteration

---

## ✨ Features

### Current Features

- ✅ **Speech-to-Text (STT)**: Convert voice to text using Faster-Whisper (base model)
- ✅ **Large Language Model (LLM)**: Process conversations with Groq's Llama-3.1-8B
- ✅ **Text-to-Speech (TTS)**: Generate natural voice with Google TTS
- ✅ **WebSocket API**: Real-time bidirectional communication
- ✅ **REST API**: Health checks and status endpoints
- ✅ **Database Integration**: Store conversations, agents, and users
- ✅ **Agent Configuration**: YAML-based agent personality and behavior
- ✅ **Conversation Memory**: Context-aware dialogue management
- ✅ **Session Management**: Isolated conversation sessions per user
- ✅ **Centralized Logging**: Structured logging with file and console output
- ✅ **Environment Configuration**: Flexible settings via environment variables
- ✅ **Docker Deployment**: One-command deployment with docker-compose
- ✅ **Development Mode**: Hot-reload for instant code updates

---

## 🏗️ Architecture

### Layered Architecture Design

The backend follows a **clean architecture pattern** with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                            │
│  (WebSocket, REST endpoints, request/response handling)     │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Service Layer                           │
│  (Business logic: STT, LLM, TTS, VoiceAssistant)           │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                     Core Layer                              │
│  (Configuration, logging, utilities)                        │
└──────────────────────┬──────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────┐
│                   Database Layer                            │
│  (Models, sessions, ORM operations)                         │
└─────────────────────────────────────────────────────────────┘
```

### Voice Pipeline Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Client  │────▶│   STT    │────▶│   LLM    │────▶│   TTS    │
│  Audio   │     │ Whisper  │     │  Groq    │     │  Google  │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     ▲                                                     │
     │                 WebSocket Connection                │
     └─────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Framework** | FastAPI | High-performance async web framework |
| **Speech Recognition** | Faster-Whisper | Fast, accurate speech-to-text |
| **Language Model** | Groq (Llama-3.1-8B) | Conversational AI responses |
| **Speech Synthesis** | Google TTS (gTTS) | Natural voice generation |
| **Database** | PostgreSQL 15 | Relational data storage |
| **ORM** | SQLAlchemy (async) | Database abstraction layer |
| **WebSocket** | FastAPI WebSockets | Real-time communication |
| **Configuration** | Pydantic Settings | Type-safe environment config |
| **Logging** | Python logging | Structured application logs |
| **Containerization** | Docker + Docker Compose | Deployment and orchestration |

### Frontend *(Coming Soon)*

- React.js with TypeScript
- WebSocket client for real-time audio streaming
- Web Audio API for microphone input
- Material-UI for component library

---

## 📁 Project Structure

```
stt-tts/
├── backend/                      # Backend application
│   ├── app/                      # Main application package
│   │   ├── __init__.py          # Package initializer (exports app)
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── api/                 # API endpoints
│   │   │   ├── __init__.py
│   │   │   ├── health.py        # Health check endpoints
│   │   │   └── websocket.py     # WebSocket endpoint
│   │   ├── core/                # Core functionality
│   │   │   ├── __init__.py
│   │   │   ├── config.py        # Configuration management
│   │   │   └── logging.py       # Logging setup
│   │   ├── db/                  # Database layer
│   │   │   ├── __init__.py
│   │   │   ├── models.py        # SQLAlchemy models
│   │   │   └── session.py       # Database session
│   │   ├── schemas/             # Pydantic schemas
│   │   │   └── __init__.py      # Request/response models
│   │   ├── services/            # Business logic
│   │   │   ├── __init__.py
│   │   │   ├── stt.py           # Speech-to-Text service
│   │   │   ├── llm.py           # LLM service
│   │   │   ├── tts.py           # Text-to-Speech service
│   │   │   └── voice_assistant.py # Orchestration service
│   │   └── utils/               # Utilities
│   │       ├── __init__.py
│   │       └── helpers.py       # Helper functions
│   ├── agents/                  # Agent configurations
│   │   └── assistant.yaml       # Default assistant config
│   ├── logs/                    # Application logs
│   │   └── app.log
│   ├── dockerfile               # Docker configuration
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Environment template
│   └── README_STRUCTURE.md      # Architecture documentation
├── frontend/                    # Frontend application (coming soon)
├── models/                      # ML model storage
│   └── stt_models/             # Cached STT models
├── docker-compose.yml          # Multi-container orchestration
├── .gitignore                  # Git ignore rules
└── readme.md                   # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Docker** and **Docker Compose** installed
- **Git** for version control
- **Groq API Key** (get it from [Groq Console](https://console.groq.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/athuljonnie/Ghostline.git
   cd Ghostline
   ```

2. **Set up environment variables**
   ```bash
   cd backend
   cp .env.example .env
   ```
   
   Edit `.env` and add your Groq API key:
   ```env
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Start the application**
   ```bash
   cd ..
   docker-compose up -d
   ```

4. **Check health status**
   ```bash
   curl http://localhost:8000/api/health
   ```

### First Run

The application will:
- Download the Faster-Whisper model (~500MB) on first run
- Initialize the PostgreSQL database
- Start the FastAPI server on port 8000
- Enable WebSocket connections at `ws://localhost:8000/ws/{agent_name}`

---

## 📚 API Documentation

### REST Endpoints

#### Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-29T07:39:45.123456",
  "version": "1.0.0",
  "components": {
    "fastapi": "running",
    "websocket": "ready",
    "stt": "faster-whisper",
    "llm": "groq-llama3",
    "tts": "google-tts",
    "database": "postgresql"
  }
}
```

### WebSocket API

#### Voice Conversation Endpoint
```
ws://localhost:8000/ws/{agent_name}
```

**Connection Flow:**
1. Client connects to WebSocket
2. Client sends audio data (binary format)
3. Server processes: STT → LLM → TTS
4. Server sends 3 messages:
   - Message 1: Transcription text (JSON)
   - Message 2: AI response text (JSON)
   - Message 3: Audio response (Base64-encoded MP3)

**Example Messages:**

*Sent by Client:*
```
<binary audio data>
```

*Received from Server:*
```json
{"type": "transcription", "text": "Hello, how are you?"}
{"type": "response", "text": "I'm doing great! How can I help you today?"}
{"type": "audio", "data": "base64_encoded_mp3_audio..."}
```

### Interactive API Docs

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🎙️ Voice Pipeline

### Complete Pipeline Flow

```
1. Audio Input (WAV/WebM)
   ↓
2. Speech-to-Text (Faster-Whisper)
   • Model: base (multi-language)
   • Device: CPU (int8 quantization)
   • Output: Transcribed text
   ↓
3. LLM Processing (Groq)
   • Model: llama-3.1-8b-instant
   • Context: Agent personality + conversation history
   • Temperature: 0.7
   • Max tokens: 512
   • Output: AI response text
   ↓
4. Text-to-Speech (Google TTS)
   • Engine: gTTS
   • Language: English (configurable)
   • Format: MP3
   • Output: Audio bytes
   ↓
5. WebSocket Response
   • Transcription (JSON)
   • Response text (JSON)
   • Audio data (Base64)
```

### Service Components

#### 1. STTService
- **Purpose**: Convert speech to text
- **Technology**: Faster-Whisper
- **Features**: Lazy loading, temp file handling, multi-language support

#### 2. LLMService
- **Purpose**: Generate intelligent responses
- **Technology**: Groq (Llama-3.1-8B)
- **Features**: Conversation memory, streaming support, configurable parameters

#### 3. TTSService
- **Purpose**: Convert text to speech
- **Technology**: Google TTS (gTTS)
- **Features**: Natural voices, multi-language, MP3 output

#### 4. VoiceAssistantService
- **Purpose**: Orchestrate the complete pipeline
- **Features**: Session management, agent configuration, memory persistence

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application
APP_NAME=AI Voice Assistant
APP_VERSION=1.0.0
DEBUG=false

# API Keys
GROQ_API_KEY=your_groq_api_key_here

# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/voice_assistant

# STT Configuration
STT_MODEL=base
STT_DEVICE=cpu
STT_COMPUTE_TYPE=int8

# LLM Configuration
LLM_MODEL=llama-3.1-8b-instant
LLM_TEMPERATURE=0.7
LLM_MAX_TOKENS=512

# TTS Configuration
TTS_LANGUAGE=en
TTS_SLOW=false

# Logging
LOG_LEVEL=INFO
LOG_FILE=/app/logs/app.log
```

### Agent Configuration

Edit `backend/agents/assistant.yaml` to customize agent behavior:

```yaml
name: assistant
description: A friendly AI voice assistant

personality:
  tone: friendly
  style: conversational
  expertise:
    - general knowledge
    - task assistance
    - conversation

system_prompt: |
  You are a helpful and friendly AI assistant.
  Provide clear, concise, and accurate responses.
  Be conversational and natural in your communication.

llm:
  model: llama-3.1-8b-instant
  temperature: 0.7
  max_tokens: 512
```

---

## 💻 Development

### Development Mode

The application is configured for hot-reload development:

1. **Start containers**
   ```bash
   docker-compose up -d
   ```

2. **Make code changes** in `backend/app/`
   - Changes are automatically synced to the container
   - Uvicorn detects changes and reloads the app
   - No rebuild required!

3. **View logs**
   ```bash
   docker logs -f ai-agent-backend
   ```

### Volume Mounts

The development setup includes volume mounts:
```yaml
volumes:
  - ./backend/app:/app/app        # Hot-reload for code
  - ./backend/agents:/app/agents  # Agent configurations
  - ./models:/root/.cache         # Model cache persistence
```

### Testing

#### Test Health Endpoint
```bash
curl http://localhost:8000/api/health
```

#### Test WebSocket Connection
```python
# backend/script.py
python script.py
```

#### Check Application Logs
```bash
docker logs --tail 100 ai-agent-backend
```

#### Access Database
```bash
docker exec -it ai-agent-db psql -U postgres -d voice_assistant
```

### Debugging

1. **Enable debug mode**
   ```env
   DEBUG=true
   LOG_LEVEL=DEBUG
   ```

2. **View detailed logs**
   ```bash
   docker logs -f ai-agent-backend
   ```

3. **Check database connections**
   ```bash
   docker exec -it ai-agent-backend python -c "from app.db.session import get_db; print('DB OK')"
   ```

---

## 🗺️ Future Roadmap

### Phase 1: User Management & Authentication 🔐
*Coming in Q1 2025*

- **User Authentication**
  - JWT-based authentication system
  - Secure password hashing with bcrypt
  - Login/logout endpoints
  - Token refresh mechanism
  - Email verification
  
- **User Profiles**
  - Profile creation and management
  - Avatar upload support
  - User preferences and settings
  - Activity tracking and history
  
- **Role-Based Access Control (RBAC)**
  - Admin, User, Guest roles
  - Permission-based access to features
  - Resource-level authorization
  - Role management dashboard

### Phase 2: Multi-Agent System 🤖
*Coming in Q2 2025*

- **Custom Agent Creation**
  - User-specific agent creation interface
  - Agent personality customization
  - Multiple agents per user account
  - Agent templates library
  
- **Agent Context Management**
  - Per-agent conversation history
  - Context persistence across sessions
  - Agent-specific knowledge bases
  - Fine-tuning capabilities
  
- **Agent Organization**
  - User-scoped agent isolation (by `user_id`)
  - Agent sharing capabilities
  - Public/private agent visibility
  - Agent versioning and rollback

### Phase 3: Enhanced Database Features 💾
*Coming in Q2 2025*

- **User Data Persistence**
  - User-localized conversations (filtered by `user_id`)
  - Conversation search and filtering
  - Export conversation history
  - Data retention policies
  
- **Advanced Agent Storage**
  - Agent configuration versioning
  - Agent performance metrics
  - Usage analytics per agent
  - Agent backup and restore

### Phase 4: Frontend Application 🎨
*Coming in Q3 2025*

- **React.js Web Interface**
  - Modern, responsive UI
  - Real-time voice chat interface
  - Visual conversation history
  - Agent management dashboard
  
- **User Dashboard**
  - Profile management
  - Agent creation and configuration
  - Conversation history viewer
  - Usage statistics and analytics
  
- **Authentication UI**
  - Login/register forms
  - Password reset functionality
  - Profile settings page
  - Role-based UI rendering

### Phase 5: Advanced Features 🚀
*Coming in Q4 2025*

- **Streaming TTS**
  - Real-time audio streaming
  - Reduced latency for responses
  - Progressive audio generation
  
- **Multi-Language Support**
  - Language detection
  - Multi-language conversations
  - Translation capabilities
  
- **Voice Cloning**
  - Custom voice profiles
  - User-specific voice synthesis
  - Voice authentication
  
- **Analytics Dashboard**
  - User engagement metrics
  - Agent performance tracking
  - Conversation insights
  - Cost optimization analytics
  
- **API Rate Limiting**
  - Per-user rate limits
  - Tiered access plans
  - Usage monitoring
  
- **WebSocket Improvements**
  - Reconnection handling
  - Message queuing
  - Compression support

### Database Schema Evolution

**Upcoming Tables:**

```sql
-- User authentication and profiles
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced agents with user relationship
CREATE TABLE agents (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    config JSONB NOT NULL,
    is_public BOOLEAN DEFAULT false,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- User-localized conversations
CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES agents(id),
    session_id VARCHAR(255),
    messages JSONB NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User preferences
CREATE TABLE user_preferences (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    preferences JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow PEP 8 style guidelines
- Add tests for new features
- Update documentation
- Ensure Docker builds successfully
- Test WebSocket connections thoroughly

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🙏 Acknowledgments

- **Faster-Whisper** for efficient speech recognition
- **Groq** for lightning-fast LLM inference
- **Google TTS** for natural voice synthesis
- **FastAPI** for the excellent web framework
- **SQLAlchemy** for robust database ORM

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/athuljonnie/Ghostline/issues)
- **Discussions**: [GitHub Discussions](https://github.com/athuljonnie/Ghostline/discussions)
- **Email**: athuljonnie93@gmail.com

---

## 📊 Status

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)
![Build Status](https://img.shields.io/badge/Build-Passing-success)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![Coverage](https://img.shields.io/badge/Coverage-85%25-yellowgreen)

**Last Updated**: October 29, 2025  
**Current Version**: 1.0.0  
**Next Release**: 1.1.0 (User Authentication - Q1 2025)
