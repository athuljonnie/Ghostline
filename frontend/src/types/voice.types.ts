/**
 * Voice interface types
 */

export type SystemState = 'idle' | 'listening' | 'speaking' | 'withholding';

export type LogLevel = 'info' | 'success' | 'error' | 'warning';

export interface LogEntry {
  message: string;
  level: LogLevel;
  timestamp: Date;
}

export interface ServerMessage {
  type: 'transcription' | 'response' | 'audio' | 'error';
  text?: string;
  audio?: string;
  message?: string;
}

export interface VoiceState {
  state: SystemState;
  transcript: string;
  response: string;
  isConnected: boolean;
  logs: LogEntry[];
}
