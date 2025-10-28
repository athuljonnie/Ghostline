import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Upload, 
  Wifi, 
  WifiOff, 
  Radio, 
  Volume2,
  Trash2,
  MessageSquare,
  Settings
} from 'lucide-react';
import './App.css';

function App() {
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [serverOnline, setServerOnline] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('assistant');
  const [messages, setMessages] = useState([]);
  const [logs, setLogs] = useState([]);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const conversationRef = useRef(null);
  const logsRef = useRef(null);

  // Check server status on mount
  useEffect(() => {
    checkServerStatus();
  }, []);

  // Auto-scroll conversation and logs
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = conversationRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [logs]);

  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      if (response.ok) {
        const data = await response.json();
        setServerOnline(true);
        addLog('Server is healthy', 'success');
        addLog(`Components: ${JSON.stringify(data.components)}`, 'info');
      } else {
        setServerOnline(false);
        addLog('Server returned error', 'error');
      }
    } catch (error) {
      setServerOnline(false);
      addLog('Cannot reach server at localhost:8000', 'error');
    }
  };

  const connect = () => {
    const wsUrl = `ws://localhost:8000/ws/${selectedAgent}`;
    addLog(`Connecting to ${wsUrl}...`, 'info');
    
    const websocket = new WebSocket(wsUrl);
    
    websocket.onopen = () => {
      setIsConnected(true);
      setWs(websocket);
      addLog('WebSocket connected successfully', 'success');
      addMessage('system', 'Connected to AI Voice Assistant');
    };
    
    websocket.onmessage = (event) => {
      handleServerMessage(event.data);
    };
    
    websocket.onerror = (error) => {
      addLog('WebSocket error occurred', 'error');
      console.error('WebSocket error:', error);
    };
    
    websocket.onclose = () => {
      setIsConnected(false);
      setWs(null);
      addLog('WebSocket disconnected', 'warning');
    };
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      setWs(null);
      setIsConnected(false);
    }
  };

  const handleServerMessage = (data) => {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'transcription') {
        addLog(`Transcribed: ${message.text}`, 'info');
        addMessage('user', message.text);
      } else if (message.type === 'response') {
        addLog(`AI Response: ${message.text}`, 'success');
        addMessage('assistant', message.text);
      } else if (message.type === 'audio') {
        addLog('Received audio response', 'success');
        playAudioResponse(message.audio);
      } else if (message.type === 'error') {
        addLog(`Error: ${message.message}`, 'error');
        addMessage('system', `Error: ${message.message}`);
      } else if (message.type === 'status') {
        addLog(`Status: ${message.message}`, 'info');
      }
    } catch (e) {
      if (data instanceof Blob) {
        addLog('Received audio blob', 'success');
        playAudioBlob(data);
      } else {
        addLog('Received unknown message format', 'warning');
      }
    }
  };

  const startRecording = async () => {
    if (!isConnected) {
      addLog('Please connect to server first', 'warning');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        await sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      addLog('Started recording', 'info');
      
    } catch (error) {
      addLog('Failed to access microphone: ' + error.message, 'error');
      alert('Please allow microphone access to use voice input');
    }
  };

  const stopRecording = () => {
    if (!isRecording || !mediaRecorderRef.current) return;
    
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    addLog('Stopped recording, sending audio...', 'info');
  };

  const sendAudio = async (audioBlob) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      addLog('WebSocket not connected', 'error');
      return;
    }
    
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      ws.send(arrayBuffer);
      addLog(`Sent ${audioBlob.size} bytes of audio`, 'success');
      addMessage('system', 'Processing your audio...');
    } catch (error) {
      addLog('Failed to send audio: ' + error.message, 'error');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    if (!isConnected) {
      addLog('Please connect to server first', 'warning');
      alert('Please connect to the server first');
      return;
    }
    
    addLog(`Uploading file: ${file.name} (${file.size} bytes)`, 'info');
    
    try {
      await sendAudio(file);
      addMessage('system', `Uploaded: ${file.name}`);
    } catch (error) {
      addLog('Failed to upload file: ' + error.message, 'error');
    }
    
    event.target.value = '';
  };

  const playAudioResponse = (base64Audio) => {
    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      playAudioBlob(blob);
    } catch (error) {
      addLog('Failed to play audio: ' + error.message, 'error');
    }
  };

  const playAudioBlob = (blob) => {
    const url = URL.createObjectURL(blob);
    setAudioUrl(url);
    addLog('Playing audio response', 'success');
  };

  const addMessage = (sender, content) => {
    setMessages(prev => [...prev, { sender, content, timestamp: new Date() }]);
  };

  const addLog = (message, level = 'info') => {
    setLogs(prev => [...prev, { message, level, timestamp: new Date() }]);
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared', 'info');
  };

  return (
    <div className="app">
      <div className="container">
        {/* Header */}
        <header className="header">
          <h1>🎤 AI Voice Assistant</h1>
          <p className="subtitle">Powered by Faster-Whisper + Groq + Google TTS</p>
        </header>

        {/* Status Bar */}
        <div className="status-bar">
          <div className="status-item">
            <span className="status-label">Server:</span>
            <span className={`status-badge ${serverOnline ? 'online' : 'offline'}`}>
              {serverOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
              {serverOnline ? 'Connected' : 'Offline'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">WebSocket:</span>
            <span className={`status-badge ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? <Radio size={16} /> : <WifiOff size={16} />}
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Audio:</span>
            <span className={`status-badge ${isRecording ? 'recording' : 'offline'}`}>
              {isRecording ? <Mic size={16} /> : <MicOff size={16} />}
              {isRecording ? 'Recording' : 'Not Recording'}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="main-content">
          {/* Control Panel */}
          <div className="panel control-panel">
            <div className="panel-header">
              <Settings size={20} />
              <h3>Controls</h3>
            </div>
            
            <div className="agent-selector">
              <label htmlFor="agent-select">Select Agent:</label>
              <select 
                id="agent-select" 
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={isConnected}
              >
                <option value="assistant">Assistant (Default)</option>
                <option value="custom">Custom Agent</option>
              </select>
            </div>

            <button 
              className={`btn btn-primary ${isConnected ? 'btn-danger' : ''}`}
              onClick={isConnected ? disconnect : connect}
            >
              {isConnected ? <WifiOff size={20} /> : <Wifi size={20} />}
              {isConnected ? 'Disconnect' : 'Connect to Server'}
            </button>

            {isConnected && (
              <div className="recording-controls">
                <button 
                  className={`btn btn-record ${isRecording ? 'recording' : ''}`}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={startRecording}
                  onTouchEnd={stopRecording}
                >
                  {isRecording ? <Mic size={24} /> : <MicOff size={24} />}
                  {isRecording ? 'Recording... Release to Send' : 'Hold to Talk'}
                </button>
                <p className="hint">Press and hold or use spacebar</p>
              </div>
            )}

            <div className="upload-section">
              <label htmlFor="audio-upload" className="upload-label">
                <Upload size={20} />
                Upload Audio File
              </label>
              <input 
                type="file" 
                id="audio-upload" 
                accept="audio/*"
                onChange={handleFileUpload}
                disabled={!isConnected}
              />
            </div>

            {audioUrl && (
              <div className="audio-player">
                <div className="audio-header">
                  <Volume2 size={20} />
                  <h4>AI Response</h4>
                </div>
                <audio src={audioUrl} controls autoPlay />
              </div>
            )}
          </div>

          {/* Conversation */}
          <div className="panel conversation-panel">
            <div className="panel-header">
              <MessageSquare size={20} />
              <h3>Conversation</h3>
            </div>
            <div className="conversation" ref={conversationRef}>
              {messages.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} />
                  <p>No messages yet. Connect and start talking!</p>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.sender}`}>
                    {msg.sender !== 'system' && (
                      <div className="message-label">
                        {msg.sender === 'user' ? '👤 You' : '🤖 AI Assistant'}
                      </div>
                    )}
                    <div className="message-content">{msg.content}</div>
                    <div className="message-time">
                      {msg.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Logs Panel */}
        <div className="panel logs-panel">
          <div className="panel-header">
            <Radio size={20} />
            <h3>System Logs</h3>
            <button className="btn-icon" onClick={clearLogs} title="Clear logs">
              <Trash2 size={18} />
            </button>
          </div>
          <div className="logs" ref={logsRef}>
            {logs.map((log, idx) => (
              <div key={idx} className="log-entry">
                <span className="log-time">
                  [{log.timestamp.toLocaleTimeString()}]
                </span>
                <span className={`log-level ${log.level}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="log-message">{log.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>Pipeline: Microphone → Faster-Whisper → LangChain+Groq → Google TTS → WebSocket</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
