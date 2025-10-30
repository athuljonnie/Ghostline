/**
 * System state indicator component
 */

import { Activity } from 'lucide-react';
import { tokens } from '../../constants/theme';
import { SystemState } from '../../types/voice.types';

interface StateIndicatorProps {
  state: SystemState;
  readyState: number | null;
}

export function StateIndicator({ state, readyState }: StateIndicatorProps) {
  const getWebSocketStatus = () => {
    if (readyState === null) return 'NULL';
    if (readyState === WebSocket.OPEN) return 'OPEN';
    return 'CLOSED';
  };

  return (
    <div className="flex flex-col gap-2">
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
        WS: {getWebSocketStatus()}
      </div>
    </div>
  );
}
