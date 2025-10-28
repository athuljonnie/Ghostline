# AI Voice Assistant - React Frontend

Modern React-based frontend for the AI Voice Assistant with Speech Recognition and Text-to-Speech.

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd frontend
npm install
``` 

### 2. Start the Development Server
```bash
npm start
```

The app will open automatically at http://localhost:3000

## 📋 Features

- 🎤 **Real-time Voice Recording**: Hold button or spacebar to record
- 🔊 **Audio Playback**: Listen to AI responses with built-in audio player
- 💬 **Conversation History**: See all messages in a clean chat interface
- 📊 **System Status**: Live monitoring of server, WebSocket, and audio status
- 📁 **File Upload**: Upload pre-recorded audio files
- 📋 **System Logs**: Real-time debugging information
- 🎨 **Modern UI**: Clean, responsive design with smooth animations
- ⌨️ **Keyboard Shortcuts**: Use spacebar to record

## 🎮 How to Use

### Step 1: Make Sure Backend is Running
```bash
# In the project root directory
docker-compose up -d
```

Verify the backend is running:
- Server status should show "Connected" (green)
- Check http://localhost:8000/health

### Step 2: Connect to Voice Assistant
1. Select your agent (default: Assistant)
2. Click "Connect to Server"
3. WebSocket status should turn green

### Step 3: Start Talking!
- **Option 1**: Hold the "Hold to Talk" button while speaking
- **Option 2**: Press and hold the spacebar while speaking
- **Option 3**: Upload an audio file using the upload button

### Step 4: Listen to Response
- The AI will process your speech
- You'll see the transcription in the conversation
- The AI response will appear as text
- Audio will play automatically (you can replay it)

## 🎨 UI Components

### Status Bar
- **Server**: Backend API connection status
- **WebSocket**: Real-time connection status
- **Audio**: Recording status indicator

### Control Panel
- **Agent Selector**: Choose different AI agents
- **Connect Button**: Establish WebSocket connection
- **Record Button**: Push-to-talk voice input
- **Upload Button**: Select audio files from your device
- **Audio Player**: Playback AI voice responses

### Conversation Panel
- **User Messages**: Your transcribed speech (blue)
- **AI Messages**: Assistant responses (green)
- **System Messages**: Status updates (orange)
- **Timestamps**: When each message was sent

### Logs Panel
- **Real-time Logs**: See what's happening under the hood
- **Color-coded**: Info (blue), Success (green), Warning (yellow), Error (red)
- **Clear Button**: Remove all logs

## 🔧 Keyboard Shortcuts

- `Space`: Hold to record (when connected)
- Release to send audio

## 📱 Responsive Design

The interface adapts to different screen sizes:
- Desktop: Full layout with sidebar
- Tablet: Stacked layout
- Mobile: Optimized touch controls

## 🛠️ Technical Stack

- **React 18**: Modern React with hooks
- **Lucide React**: Beautiful icon library
- **WebSocket API**: Real-time bidirectional communication
- **MediaRecorder API**: Browser audio recording
- **Web Audio API**: Audio playback and processing

## 🐛 Troubleshooting

### "Cannot reach server"
- Make sure Docker containers are running: `docker-compose up -d`
- Check backend logs: `docker logs ai-agent-backend`
- Verify port 8000 is not in use

### "Microphone access denied"
- Click the address bar lock icon
- Allow microphone permissions
- Refresh the page

### "WebSocket connection failed"
- Ensure backend is running
- Check if WebSocket port is accessible
- Review system logs for error details

### Audio not playing
- Check browser audio permissions
- Ensure speakers/headphones are connected
- Look for errors in browser console (F12)

## 📦 Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

## 🌐 Environment Variables

You can customize the backend URL by creating a `.env` file:

```env
REACT_APP_BACKEND_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

## 📄 Available Scripts

- `npm start`: Run development server
- `npm run build`: Build for production
- `npm test`: Run tests
- `npm run eject`: Eject from Create React App

## 🎯 Next Steps

1. **Custom Agents**: Create YAML files in `backend/agents/` for specialized assistants
2. **Voice Options**: Modify TTS settings for different voices
3. **Themes**: Add dark mode or custom color schemes
4. **Multi-language**: Support different languages in STT/TTS
5. **History**: Save conversation history to database

## 📚 Learn More

- [React Documentation](https://react.dev)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [MediaRecorder API](https://developer.mozilla.org/en-US/docs/Web/API/MediaRecorder)

---

**Built with ❤️ using React**
