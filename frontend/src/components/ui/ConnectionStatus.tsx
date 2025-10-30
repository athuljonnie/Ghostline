/**
 * Connection status indicator component
 */

import { Radio } from 'lucide-react';
import { tokens } from '../../constants/theme';

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
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
  );
}
