/**
 * Custom hook for log management
 */

import { useState, useCallback } from 'react';
import { LogEntry, LogLevel } from '../types/voice.types';

interface UseLogsReturn {
  logs: LogEntry[];
  addLog: (message: string, level?: LogLevel) => void;
  clearLogs: () => void;
}

export const useLogs = (): UseLogsReturn => {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = useCallback((message: string, level: LogLevel = 'info') => {
    setLogs((prev) => [...prev, { message, level, timestamp: new Date() }]);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    logs,
    addLog,
    clearLogs,
  };
};
