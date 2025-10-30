/**
 * Voice control button component
 */

import { Mic, MicOff } from 'lucide-react';
import { tokens } from '../../constants/theme';
import { SystemState } from '../../types/voice.types';

interface VoiceButtonProps {
  state: SystemState;
  onToggle: () => void;
}

export function VoiceButton({ state, onToggle }: VoiceButtonProps) {
  const isDisabled = state === 'speaking' || state === 'withholding';
  const isListening = state === 'listening';

  return (
    <button
      onClick={onToggle}
      disabled={isDisabled}
      className="relative group"
      style={{
        transition: `all ${tokens.motion.timing.fast} ${tokens.motion.easing.liquidWeight}`,
      }}
    >
      <div
        className="absolute inset-0 rounded-full transition-all duration-700"
        style={{
          backgroundColor: isListening ? tokens.colors.ghostGlowActive : tokens.colors.ghostGlowIdle,
          filter: `blur(${tokens.blur.ghost})`,
          transform: isListening ? 'scale(2)' : 'scale(1)',
        }}
      />

      <div
        className="relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-150"
        style={{
          backgroundColor: tokens.colors.structureDeep,
          borderWidth: '2px',
          borderColor: isListening ? tokens.colors.signalActive : tokens.colors.signalPassive,
          boxShadow: isListening
            ? `0 0 30px ${tokens.colors.signalActive}60, inset 0 0 20px ${tokens.colors.signalActive}20`
            : 'none',
        }}
      >
        {isListening ? (
          <MicOff
            size={32}
            style={{
              color: tokens.colors.signalActive,
              strokeWidth: 1.5,
            }}
          />
        ) : (
          <Mic
            size={32}
            style={{
              color: tokens.colors.signalPassive,
              strokeWidth: 1.5,
            }}
          />
        )}
      </div>
    </button>
  );
}
