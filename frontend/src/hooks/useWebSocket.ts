/**
 * Custom hook for WebSocket management
 */

import { useEffect, useRef, useState } from 'react';
import { WebSocketService } from '../services/websocket.service';
import { ServerMessage, LogEntry } from '../types/voice.types';

interface UseWebSocketReturn {
  isConnected: boolean;
  sendAudio: (audioBlob: Blob) => Promise<void>;
  readyState: number | null;
}

export const useWebSocket = (
  onMessage: (data: ServerMessage | Blob) => void,
  addLog: (message: string, level: LogEntry['level']) => void
): UseWebSocketReturn => {
  const [isConnected, setIsConnected] = useState(false);
  const wsServiceRef = useRef<WebSocketService | null>(null);

  useEffect(() => {
    const wsService = new WebSocketService(
      onMessage,
      setIsConnected,
      addLog
    );

    wsService.connect();
    wsServiceRef.current = wsService;

    return () => {
      wsService.disconnect();
    };
  }, [onMessage, addLog]);

  const sendAudio = async (audioBlob: Blob): Promise<void> => {
    if (!wsServiceRef.current) {
      addLog('❌ Cannot send audio: WebSocket service not initialized', 'error');
      return;
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    wsServiceRef.current.send(arrayBuffer);
  };

  const readyState = wsServiceRef.current?.getReadyState() ?? null;

  return {
    isConnected,
    sendAudio,
    readyState,
  };
};
