/**
 * System logs panel component
 */

import { useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { tokens } from '../../constants/theme';
import { LogEntry } from '../../types/voice.types';

interface LogsPanelProps {
  logs: LogEntry[];
}

export function LogsPanel({ logs }: LogsPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const getLevelColor = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return '#22c55e';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#3b82f6';
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-0 transition-all duration-500"
      style={{
        height: '35vh',
        backgroundColor: '#16213e',
        borderTop: '2px solid #3b82f6',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.5)',
      }}
    >
      {/* Header */}
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

      {/* Content */}
      <div className="p-4 h-[calc(100%-56px)] overflow-y-auto" style={{ backgroundColor: '#16213e' }}>
        <div className="space-y-2">
          {logs.map((log, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3 p-2 rounded"
              style={{
                fontFamily: 'monospace',
                backgroundColor: 'rgba(15, 23, 42, 0.5)',
                borderLeft: `3px solid ${getLevelColor(log.level)}`,
              }}
            >
              <span style={{ color: '#94a3b8', fontSize: '0.75rem', minWidth: '80px' }}>
                {log.timestamp.toLocaleTimeString()}
              </span>
              <span
                style={{
                  color: getLevelColor(log.level),
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
  );
}
