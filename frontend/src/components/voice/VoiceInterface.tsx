/**
 * Main voice interface component
 * Orchestrates voice interaction with clean separation of concerns
 */

import { useState, useCallback } from 'react';
import { tokens } from '../../constants/theme';
import { SystemState, ServerMessage } from '../../types/voice.types';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { useLogs } from '../../hooks/useLogs';
import { decodeBase64Audio, playAudioBlob } from '../../utils/audio.utils';

// UI Components
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { StateIndicator } from '../ui/StateIndicator';
import { TranscriptionPanel } from '../ui/TranscriptionPanel';
import { VoiceButton } from '../ui/VoiceButton';
import { LogsPanel } from '../ui/LogsPanel';
import { SpectralPresence } from './SpectralPresence';

export function VoiceInterface() {
  const [state, setState] = useState<SystemState>('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  const { logs, addLog } = useLogs();

  // Handle server messages
  const handleServerMessage = useCallback(
    (data: ServerMessage | Blob) => {
      if (data instanceof Blob) {
        addLog(`🔊 Received binary audio (${data.size} bytes)`, 'info');
        playAudioBlob(data)
          .then(() => addLog('✅ Audio playback completed', 'success'))
          .catch((err) => addLog(`❌ Audio playback failed: ${err}`, 'error'));
        return;
      }

      const message = data as ServerMessage;

      switch (message.type) {
        case 'transcription':
          setTranscript(message.text || '');
          addLog(`🎤 Transcribed: "${message.text}"`, 'info');
          break;

        case 'response':
          setResponse(message.text || '');
          setState('speaking');
          addLog(`🤖 AI Response: "${message.text}"`, 'success');
          setTimeout(() => {
            setState('idle');
            addLog('✅ Returned to idle state', 'info');
          }, 3000);
          break;

        case 'audio':
          if (message.audio) {
            addLog(`🔊 Received audio data (${message.audio.length} bytes)`, 'success');
            const audioBlob = decodeBase64Audio(message.audio);
            playAudioBlob(audioBlob)
              .then(() => addLog('✅ Audio playback started', 'success'))
              .catch((err) => addLog(`❌ Audio playback failed: ${err}`, 'error'));
          }
          break;

        case 'error':
          addLog(`❌ Server Error: ${message.message}`, 'error');
          setState('withholding');
          setTimeout(() => setState('idle'), 2000);
          break;
      }
    },
    [addLog]
  );

  // WebSocket connection
  const { isConnected, sendAudio, readyState } = useWebSocket(handleServerMessage, addLog);

  // Audio recording
  const handleRecordingComplete = useCallback(
    async (audioBlob: Blob) => {
      await sendAudio(audioBlob);
    },
    [sendAudio]
  );

  const { isRecording, startRecording, stopRecording } = useAudioRecorder(
    handleRecordingComplete,
    addLog
  );

  // Toggle voice recording
  const toggleListening = useCallback(async () => {
    if (!isConnected) {
      addLog('⚠️ Cannot record: WebSocket not connected', 'warning');
      return;
    }

    if (state === 'idle') {
      try {
        setState('listening');
        setTranscript('');
        setResponse('');
        await startRecording();
      } catch (error) {
        setState('withholding');
        setTimeout(() => setState('idle'), 2000);
      }
    } else if (state === 'listening') {
      stopRecording();
      setState('idle');
    }
  }, [state, isConnected, startRecording, stopRecording, addLog]);

  const chamberDarkness = state === 'withholding' ? 0.98 : state === 'listening' ? 0.96 : 0.94;

  return (
    <div
      className="relative w-full h-screen flex flex-col items-center justify-center overflow-hidden transition-all duration-1000"
      style={{
        backgroundColor: '#1a1a2e',
        filter: `brightness(${chamberDarkness})`,
      }}
    >
      {/* Spectral Visualization */}
      <SpectralPresence
        isActive={state === 'speaking'}
        isListening={state === 'listening'}
        audioLevel={0.5}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-between p-12 z-10 pb-[35vh]">
        {/* Top Right: Connection Status */}
        <div className="absolute top-6 right-6 flex items-center gap-3">
          <ConnectionStatus isConnected={isConnected} />
        </div>

        {/* Top Left: State Indicator */}
        <div className="absolute top-6 left-6">
          <StateIndicator state={state} readyState={readyState} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center w-full max-w-6xl">
          <div className="w-full space-y-8">
            <TranscriptionPanel transcript={transcript} response={response} state={state} />

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

        {/* Voice Control Button */}
        <div className="flex items-center justify-center">
          <VoiceButton state={state} onToggle={toggleListening} />
        </div>
      </div>

      {/* Decorative Lines */}
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

      {/* System Logs */}
      <LogsPanel logs={logs} />
    </div>
  );
}
