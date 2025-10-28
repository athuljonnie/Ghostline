import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Radio, Activity } from 'lucide-react';
import { tokens } from '../tokens';
import { SpectralPresence } from './SpectralPresence';

type SystemState = 'idle' | 'listening' | 'speaking' | 'withholding';

interface LogEntry {
  message: string;
  level: 'info' | 'success' | 'error' | 'warning';
  timestamp: Date;
}

export function VoiceInterface() {
  const [state, setState] = useState<SystemState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string, level: LogEntry['level'] = 'info') => {
    setLogs((prev: LogEntry[]) => [...prev, { message, level, timestamp: new Date() }]);
  };

  // Connect to WebSocket on mount
  useEffect(() => {
    connectWebSocket();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const connectWebSocket = () => {
    try {
      addLog('🔌 Connecting to WebSocket server...', 'info');
      const ws = new WebSocket('ws://localhost:8000/ws/assistant');
      
      ws.onopen = () => {
        setIsConnected(true);
        addLog('✅ Connected to AI Voice Assistant', 'success');
        addLog(`📡 WebSocket ready state: ${ws.readyState} (OPEN)`, 'info');
        wsRef.current = ws;
      };

      ws.onmessage = (event) => {
        addLog(`📨 Message received from server`, 'info');
        handleServerMessage(event.data);
      };

      ws.onerror = (error) => {
        addLog(`❌ WebSocket error: ${error}`, 'error');
      };

      ws.onclose = (event) => {
        setIsConnected(false);
        addLog(`🔴 Disconnected from server (Code: ${event.code}, Reason: ${event.reason || 'None'})`, 'warning');
        wsRef.current = null;
      };
    } catch (error) {
      addLog(`❌ Failed to connect to server: ${error}`, 'error');
    }
  };

  const handleServerMessage = (data: any) => {
    try {
      const message = JSON.parse(data);
      addLog(`📩 Received message type: ${message.type}`, 'info');
      
      if (message.type === 'transcription') {
        setTranscript(message.text);
        addLog(`🎤 Transcribed: "${message.text}"`, 'info');
      } else if (message.type === 'response') {
        setResponse(message.text);
        setState('speaking');
        addLog(`🤖 AI Response: "${message.text}"`, 'success');
        
        // Return to idle after response
        setTimeout(() => {
          setState('idle');
          addLog('✅ Returned to idle state', 'info');
        }, 3000);
      } else if (message.type === 'audio') {
        addLog(`🔊 Received audio data (${message.audio.length} bytes)`, 'success');
        playAudioResponse(message.audio);
      } else if (message.type === 'error') {
        addLog(`❌ Server Error: ${message.message}`, 'error');
        setState('withholding');
        setTimeout(() => setState('idle'), 2000);
      }
    } catch (e) {
      // Handle binary audio data
      if (data instanceof Blob) {
        addLog(`🔊 Received binary audio (${data.size} bytes)`, 'info');
        playAudioBlob(data);
      } else {
        addLog(`⚠️ Failed to parse message: ${e}`, 'warning');
      }
    }
  };

  const playAudioResponse = (base64Audio: string) => {
    try {
      addLog(`🎵 Decoding base64 audio...`, 'info');
      const audioData = atob(base64Audio);
      const arrayBuffer = new ArrayBuffer(audioData.length);
      const view = new Uint8Array(arrayBuffer);
      
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i);
      }
      
      const blob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
      addLog(`✅ Audio decoded successfully (${blob.size} bytes)`, 'success');
      playAudioBlob(blob);
    } catch (error) {
      addLog(`❌ Failed to decode/play audio: ${error}`, 'error');
    }
  };

  const playAudioBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    addLog(`▶️ Playing audio...`, 'info');
    audio.play()
      .then(() => {
        addLog(`✅ Audio playback started`, 'success');
      })
      .catch((err) => {
        addLog(`❌ Audio playback failed: ${err}`, 'error');
      });
  };

  const startRecording = async () => {
    if (!isConnected) {
      addLog('⚠️ Cannot record: WebSocket not connected', 'warning');
      return;
    }

    try {
      addLog('🎤 Requesting microphone access...', 'info');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      addLog('✅ Microphone access granted', 'success');
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          addLog(`📊 Audio chunk: ${event.data.size} bytes`, 'info');
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        addLog(`🎵 Recording complete: ${audioBlob.size} bytes total`, 'success');
        await sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setState('listening');
      setTranscript('');
      setResponse('');
      addLog('🔴 Recording started', 'success');
      
    } catch (error) {
      addLog(`❌ Microphone access denied: ${error}`, 'error');
      setState('withholding');
      setTimeout(() => setState('idle'), 2000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === 'listening') {
      mediaRecorderRef.current.stop();
      setState('idle');
      addLog('⏹️ Recording stopped, processing...', 'info');
    }
  };

  const sendAudio = async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      addLog('❌ Cannot send audio: WebSocket not connected', 'error');
      return;
    }
    
    try {
      addLog(`📤 Sending audio to server (${audioBlob.size} bytes)...`, 'info');
      const arrayBuffer = await audioBlob.arrayBuffer();
      wsRef.current.send(arrayBuffer);
      addLog(`✅ Audio sent successfully`, 'success');
    } catch (error) {
      addLog(`❌ Failed to send audio: ${error}`, 'error');
    }
  };

  const toggleListening = () => {
    if (state === 'idle') {
      startRecording();
    } else if (state === 'listening') {
      stopRecording();
    }
  };

  const chamberDarkness = state === 'withholding' ? 0.98 : state === 'listening' ? 0.96 : 0.94;

  return (
    <div
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        backgroundColor: '#1a1a2e',
        filter: `brightness(${chamberDarkness})`,
      }}
    >
      <SpectralPresence
        isActive={state === 'speaking'}
        isListening={state === 'listening'}
        audioLevel={0.5}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-between p-12 z-10 pb-[35vh]">
        {/* Connection Status - Top Right */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <div
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg backdrop-blur-md"
            style={{
              backgroundColor: isConnected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              borderWidth: '2px',
              borderColor: isConnected ? '#22c55e' : '#ef4444',
            }}
          >
            <Radio
              size={18}
              style={{
                color: isConnected ? '#22c55e' : '#ef4444',
                strokeWidth: 2.5,
              }}
            />
            <span
              style={{
                fontFamily: tokens.typography.fontFamily,
                fontSize: '0.9rem',
                color: isConnected ? '#22c55e' : '#ef4444',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Debug Info - Top Left */}
        <div className="absolute top-6 left-6 flex flex-col gap-2">
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(59, 130, 246, 0.15)',
              borderWidth: '2px',
              borderColor: '#3b82f6',
            }}
          >
            <Activity
              size={18}
              style={{
                color: '#3b82f6',
                strokeWidth: 2.5,
              }}
            />
            <span
              style={{
                fontFamily: tokens.typography.fontFamily,
                fontSize: '0.9rem',
                color: '#3b82f6',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              STATE: {state.toUpperCase()}
            </span>
          </div>
          
          {/* WebSocket Status */}
          <div
            className="px-4 py-2 rounded-lg backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(168, 85, 247, 0.15)',
              borderWidth: '2px',
              borderColor: '#a855f7',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              color: '#a855f7',
            }}
          >
            WS: {wsRef.current ? wsRef.current.readyState === WebSocket.OPEN ? 'OPEN' : 'CLOSED' : 'NULL'}
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full max-w-6xl">
          <div className="w-full space-y-8">
            {/* Transcription Display Panel */}
            <div className="grid grid-cols-2 gap-6 px-8">
              {/* What You Said */}
              <div
                className="p-6 rounded-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  borderWidth: '2px',
                  borderColor: transcript ? '#3b82f6' : 'rgba(59, 130, 246, 0.3)',
                  minHeight: '150px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: state === 'listening' ? '#22c55e' : transcript ? '#3b82f6' : '#64748b',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: tokens.typography.fontFamily,
                      fontSize: '0.75rem',
                      color: '#60a5fa',
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                    }}
                  >
                    YOU SAID
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: tokens.typography.fontFamily,
                    fontWeight: tokens.typography.weights.light,
                    fontSize: '1.25rem',
                    lineHeight: '1.8',
                    color: transcript ? '#e2e8f0' : '#64748b',
                    opacity: transcript ? 1 : 0.5,
                    minHeight: '80px',
                  }}
                >
                  {transcript || (state === 'listening' ? 'Listening...' : 'No input yet')}
                </div>
              </div>

              {/* AI Response */}
              <div
                className="p-6 rounded-lg backdrop-blur-md"
                style={{
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  borderWidth: '2px',
                  borderColor: response ? '#22c55e' : 'rgba(34, 197, 94, 0.3)',
                  minHeight: '150px',
                  transition: 'all 0.3s ease',
                }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: state === 'speaking' ? '#22c55e' : response ? '#22c55e' : '#64748b',
                    }}
                  />
                  <span
                    style={{
                      fontFamily: tokens.typography.fontFamily,
                      fontSize: '0.75rem',
                      color: '#22c55e',
                      letterSpacing: '0.1em',
                      fontWeight: 700,
                    }}
                  >
                    AI RESPONSE
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: tokens.typography.fontFamily,
                    fontWeight: tokens.typography.weights.regular,
                    fontSize: '1.25rem',
                    lineHeight: '1.8',
                    color: response ? '#e2e8f0' : '#64748b',
                    opacity: response ? 1 : 0.5,
                    minHeight: '80px',
                  }}
                >
                  {response || (state === 'speaking' ? 'Speaking...' : 'Waiting for response')}
                </div>
              </div>
            </div>

            {state === 'idle' && !transcript && (
              <div
                className="text-center transition-all duration-1000"
                style={{
                  fontFamily: tokens.typography.fontFamily,
                  fontWeight: tokens.typography.weights.light,
                  fontSize: '1.1rem',
                  lineHeight: tokens.typography.lineHeight,
                  letterSpacing: tokens.typography.letterSpacing.idle,
                  color: '#94a3b8',
                  opacity: 0.8,
                }}
              >
                Click microphone to start voice interaction
              </div>
            )}

            {state === 'withholding' && (
              <div
                className="text-center transition-all duration-1000"
                style={{
                  fontFamily: tokens.typography.fontFamily,
                  fontWeight: tokens.typography.weights.light,
                  fontSize: '0.875rem',
                  lineHeight: tokens.typography.lineHeight,
                  color: '#f59e0b',
                }}
              >
                Processing...
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-center">
          <button
            onClick={toggleListening}
            disabled={state === 'speaking' || state === 'withholding'}
            className="relative group"
            style={{
              transition: `all ${tokens.motion.timing.fast} ${tokens.motion.easing.liquidWeight}`,
            }}
          >
            <div
              className="absolute inset-0 rounded-full transition-all duration-700"
              style={{
                backgroundColor: state === 'listening' ? tokens.colors.ghostGlowActive : tokens.colors.ghostGlowIdle,
                filter: `blur(${tokens.blur.ghost})`,
                transform: state === 'listening' ? 'scale(2)' : 'scale(1)',
              }}
            />

            <div
              className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150"
              style={{
                backgroundColor: tokens.colors.structureDeep,
                borderWidth: '2px',
                borderColor: state === 'listening' ? tokens.colors.signalActive : tokens.colors.signalPassive,
                boxShadow: state === 'listening' 
                  ? `0 0 30px ${tokens.colors.signalActive}60, inset 0 0 20px ${tokens.colors.signalActive}20` 
                  : 'none',
              }}
            >
              {state === 'listening' ? (
                <MicOff
                  size={32}
                  style={{
                    color: tokens.colors.signalActive,
                    strokeWidth: 1.5,
                  }}
                />
              ) : (
                <Mic
                  size={32}
                  style={{
                    color: tokens.colors.signalPassive,
                    strokeWidth: 1.5,
                  }}
                />
              )}
            </div>
          </button>
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          backgroundColor: tokens.colors.signalPassive,
          opacity: 0.3,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          backgroundColor: tokens.colors.signalPassive,
          opacity: 0.3,
        }}
      />

      {/* Logs Panel - Always Visible */}
      <div
        className="absolute bottom-0 left-0 right-0 transition-all duration-500"
        style={{
          height: '35vh',
          backgroundColor: '#16213e',
          borderTop: '2px solid #3b82f6',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Logs Header */}
        <div
          className="px-6 py-3 flex items-center justify-between"
          style={{
            backgroundColor: '#0f1729',
            borderBottom: '1px solid #3b82f6',
          }}
        >
          <div className="flex items-center gap-3">
            <Activity size={20} style={{ color: '#3b82f6', strokeWidth: 2.5 }} />
            <span
              style={{
                fontFamily: tokens.typography.fontFamily,
                fontSize: '1rem',
                color: '#60a5fa',
                letterSpacing: '0.08em',
                fontWeight: 700,
              }}
            >
              SYSTEM LOGS
            </span>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#94a3b8',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              {logs.length} entries
            </span>
          </div>
        </div>

        {/* Logs Content */}
        <div className="p-4 h-[calc(100%-56px)] overflow-y-auto" style={{ backgroundColor: '#16213e' }}>
          <div className="space-y-2">
            {logs.map((log: LogEntry, idx: number) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-2 rounded"
                style={{
                  fontFamily: 'monospace',
                  backgroundColor: 'rgba(15, 23, 42, 0.5)',
                  borderLeft: `3px solid ${
                    log.level === 'success'
                      ? '#22c55e'
                      : log.level === 'error'
                      ? '#ef4444'
                      : log.level === 'warning'
                      ? '#f59e0b'
                      : '#3b82f6'
                  }`,
                }}
              >
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', minWidth: '80px' }}>
                  {log.timestamp.toLocaleTimeString()}
                </span>
                <span
                  style={{
                    color:
                      log.level === 'success'
                        ? '#22c55e'
                        : log.level === 'error'
                        ? '#ef4444'
                        : log.level === 'warning'
                        ? '#f59e0b'
                        : '#3b82f6',
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    minWidth: '70px',
                  }}
                >
                  {log.level.toUpperCase()}
                </span>
                <span style={{ flex: 1, color: '#e2e8f0', fontSize: '0.875rem' }}>{log.message}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '2rem',
                  color: '#64748b',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                }}
              >
                Waiting for system events...
              </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
