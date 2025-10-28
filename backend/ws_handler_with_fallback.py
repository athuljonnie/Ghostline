import asyncio
import os
import tempfile
from fastapi import WebSocket, WebSocketDisconnect
from faster_whisper import WhisperModel
from TTS.api import TTS
from pathlib import Path
import yaml
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from io import BytesIO

# Global variables for models (will be loaded lazily)
stt_model = None
tts_model = None

def load_stt_model():
    """Load STT model lazily"""
    global stt_model
    if stt_model is None:
        try:
            stt_model = WhisperModel("small", device="cpu")
            print("STT model loaded successfully")
        except Exception as e:
            print(f"Error loading STT model: {e}")
            stt_model = False  # Mark as failed to avoid retrying
    return stt_model if stt_model is not False else None

def load_tts_model():
    """Load TTS model lazily"""
    global tts_model
    if tts_model is None:
        try:
            tts_model = TTS("tts_models/en/ljspeech/tacotron2-DDC")
            print("TTS model loaded successfully")
        except Exception as e:
            print(f"Error loading TTS model: {e}")
            tts_model = False  # Mark as failed to avoid retrying
    return tts_model if tts_model is not False else None

# Agents folder
AGENTS_DIR = Path(__file__).parent / "agents"

# Load agent configs
def load_agent(agent_name):
    agent_file = AGENTS_DIR / f"{agent_name}.yaml"
    if not agent_file.exists():
        return None
    with open(agent_file, "r") as f:
        return yaml.safe_load(f)

# Create LangChain chain per agent
def get_agent_chain(agent_config):
    prompt = ChatPromptTemplate.from_messages([
        ("system", agent_config['system_prompt']),
        ("human", "Conversation history:\n{history}\n\nUser: {user_input}")
    ])
    llm = ChatOpenAI(
        model_name="gpt-3.5-turbo",
        temperature=agent_config.get("temperature", 0.5)
    )
    return prompt | llm

async def handle_agent_ws(websocket: WebSocket, agent_name: str):
    try:
        await websocket.accept()
        print(f"WebSocket accepted for agent: {agent_name}")
        
        # Send a welcome message first
        await websocket.send_text(f"Connected to agent: {agent_name}")
        print("Welcome message sent")

        # Load models lazily and check if they're available
        try:
            await websocket.send_text("Loading STT model...")
            print("About to load STT model")
            stt = load_stt_model()
            if stt is None:
                await websocket.send_text("STT model not available")
                await websocket.close()
                return
            await websocket.send_text("STT model loaded successfully")
            print("STT model loaded")
            
            await websocket.send_text("Loading TTS model...")
            print("About to load TTS model")
            tts = load_tts_model()
            if tts is None:
                await websocket.send_text("TTS model not available")
                await websocket.close()
                return
            await websocket.send_text("TTS model loaded successfully")
            print("TTS model loaded")
            
        except Exception as e:
            print(f"Error loading models: {str(e)}")
            await websocket.send_text(f"Error loading models: {str(e)}")
            await websocket.close()
            return

        print(f"Loading agent config for: {agent_name}")
        agent_config = load_agent(agent_name)
        if agent_config is None:
            await websocket.send_text(f"Agent {agent_name} not found.")
            await websocket.close()
            return
        print("Agent config loaded")

        chain = get_agent_chain(agent_config)
        conversation_history = []
        
        await websocket.send_text("Ready to receive audio data!")
        print("WebSocket setup complete, ready for audio data")
        
    except Exception as e:
        print(f"Error in WebSocket setup: {str(e)}")
        try:
            await websocket.send_text(f"Setup error: {str(e)}")
            await websocket.close()
        except:
            pass
        return

    try:
        while True:
            data = await websocket.receive_bytes()

            # Save audio data to temporary file for processing
            with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
                temp_audio.write(data)
                temp_audio_path = temp_audio.name

            try:
                # Transcribe
                segments, _ = stt.transcribe(temp_audio_path, language="en")
                user_text = " ".join([segment.text for segment in segments])
                
                if not user_text.strip():
                    await websocket.send_text("No speech detected in audio")
                    continue
                    
                print(f"Transcribed text: {user_text}")
                conversation_history.append(f"User: {user_text}")

                # Check if OpenAI API is available
                try:
                    # Get response from LLM
                    response = await chain.ainvoke({
                        "history": "\n".join(conversation_history),
                        "user_input": user_text
                    })
                    response_text = response.content
                except Exception as api_error:
                    # If OpenAI API fails, use a mock response
                    print(f"OpenAI API error: {str(api_error)}")
                    if "quota" in str(api_error).lower() or "insufficient" in str(api_error).lower():
                        response_text = f"I heard you say: '{user_text}'. This is a test response since the OpenAI API quota has been exceeded. Your voice processing system is working correctly!"
                    else:
                        response_text = f"I processed your audio and heard: '{user_text}'. However, I cannot generate a full AI response due to an API issue."
                
                conversation_history.append(f"Assistant: {response_text}")

                # TTS - use temporary file
                with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_tts:
                    tts_file = temp_tts.name

                tts.tts_to_file(text=response_text, file_path=tts_file)

                # Read generated audio file
                with open(tts_file, "rb") as f:
                    audio_bytes = f.read()

                # Reply audio
                await websocket.send_bytes(audio_bytes)
                print(f"Sent audio response: {len(audio_bytes)} bytes")
                
                # Clean up temporary files
                os.unlink(tts_file)
                
            except Exception as e:
                await websocket.send_text(f"Error processing audio: {str(e)}")
            finally:
                # Clean up input audio file
                if os.path.exists(temp_audio_path):
                    os.unlink(temp_audio_path)

    except WebSocketDisconnect:
        print(f"Client disconnected from agent {agent_name}")
        await websocket.close()