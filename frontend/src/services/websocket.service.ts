/**
 * WebSocket service for voice communication
 */

import { API_CONFIG } from '../constants/theme';
import { ServerMessage } from '../types/voice.types';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000;

  constructor(
    private onMessage: (data: ServerMessage | Blob) => void,
    private onConnectionChange: (connected: boolean) => void,
    private onLog: (message: string, level: 'info' | 'success' | 'error' | 'warning') => void
  ) {}

  connect(): void {
    try {
      this.onLog('🔌 Connecting to WebSocket server...', 'info');
      const wsUrl = `${API_CONFIG.WS_URL}${API_CONFIG.WS_ENDPOINT}`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.onConnectionChange(true);
        this.onLog('✅ Connected to AI Voice Assistant', 'success');
        this.onLog(`📡 WebSocket ready state: ${this.ws?.readyState} (OPEN)`, 'info');
      };

      this.ws.onmessage = (event) => {
        this.onLog('📨 Message received from server', 'info');
        this.handleMessage(event.data);
      };

      this.ws.onerror = (error) => {
        this.onLog(`❌ WebSocket error: ${error}`, 'error');
      };

      this.ws.onclose = (event) => {
        this.onConnectionChange(false);
        this.onLog(
          `🔴 Disconnected from server (Code: ${event.code}, Reason: ${event.reason || 'None'})`,
          'warning'
        );
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      this.onLog(`❌ Failed to connect to server: ${error}`, 'error');
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.onLog(
        `🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`,
        'warning'
      );
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  private handleMessage(data: any): void {
    try {
      const message: ServerMessage = JSON.parse(data);
      this.onLog(`📩 Received message type: ${message.type}`, 'info');
      this.onMessage(message);
    } catch (e) {
      // Handle binary audio data
      if (data instanceof Blob) {
        this.onLog(`🔊 Received binary audio (${data.size} bytes)`, 'info');
        this.onMessage(data);
      } else {
        this.onLog(`⚠️ Failed to parse message: ${e}`, 'warning');
      }
    }
  }

  send(data: ArrayBuffer): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.onLog('❌ Cannot send audio: WebSocket not connected', 'error');
      return;
    }

    try {
      this.onLog(`📤 Sending audio to server (${data.byteLength} bytes)...`, 'info');
      this.ws.send(data);
      this.onLog('✅ Audio sent successfully', 'success');
    } catch (error) {
      this.onLog(`❌ Failed to send audio: ${error}`, 'error');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getReadyState(): number | null {
    return this.ws?.readyState ?? null;
  }
}
