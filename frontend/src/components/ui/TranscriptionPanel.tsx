/**
 * Transcription display panel component
 */

import { tokens } from '../../constants/theme';
import { SystemState } from '../../types/voice.types';

interface TranscriptionPanelProps {
  transcript: string;
  response: string;
  state: SystemState;
}

export function TranscriptionPanel({ transcript, response, state }: TranscriptionPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-6 px-8">
      {/* User Input */}
      <div
        className="p-6 rounded-lg"
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
            INPUT
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
        className="p-6 rounded-lg"
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
  );
}
