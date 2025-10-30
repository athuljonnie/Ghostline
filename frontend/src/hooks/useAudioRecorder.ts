/**
 * Custom hook for audio recording
 */

import { useRef, useState } from 'react';
import { requestMicrophoneAccess, stopMediaStream } from '../utils/audio.utils';
import { LogEntry } from '../types/voice.types';

interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
}

export const useAudioRecorder = (
  onRecordingComplete: (audioBlob: Blob) => void,
  addLog: (message: string, level: LogEntry['level']) => void
): UseAudioRecorderReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = async (): Promise<void> => {
    try {
      addLog('🎤 Requesting microphone access...', 'info');
      const stream = await requestMicrophoneAccess();
      streamRef.current = stream;
      addLog('✅ Microphone access granted', 'success');

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          addLog(`📊 Audio chunk: ${event.data.size} bytes`, 'info');
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        addLog(`🎵 Recording complete: ${audioBlob.size} bytes total`, 'success');
        onRecordingComplete(audioBlob);
        
        if (streamRef.current) {
          stopMediaStream(streamRef.current);
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      addLog('🔴 Recording started', 'success');
    } catch (error) {
      addLog(`❌ Microphone access denied: ${error}`, 'error');
      throw error;
    }
  };

  const stopRecording = (): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      addLog('⏹️ Recording stopped, processing...', 'info');
    }
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
  };
};
