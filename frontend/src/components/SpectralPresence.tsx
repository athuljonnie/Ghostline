import { useEffect, useState } from 'react';
import { tokens } from '../tokens';

interface SpectralPresenceProps {
  isActive: boolean;
  isListening: boolean;
  audioLevel?: number;
}

export function SpectralPresence({ isActive, isListening, audioLevel = 0 }: SpectralPresenceProps) {
  const [waves, setWaves] = useState<number[]>(Array(32).fill(0));

  useEffect(() => {
    if (!isActive && !isListening) {
      const interval = setInterval(() => {
        setWaves(prev => prev.map(() => Math.random() * 0.03));
      }, 2000);
      return () => clearInterval(interval);
    }

    if (isListening) {
      const interval = setInterval(() => {
        setWaves(prev => prev.map(() => Math.random() * 0.15 + audioLevel * 0.3));
      }, 50);
      return () => clearInterval(interval);
    }

    if (isActive) {
      const interval = setInterval(() => {
        setWaves(prev => prev.map(() => Math.random() * 0.4 + audioLevel * 0.6));
      }, 40);
      return () => clearInterval(interval);
    }
  }, [isActive, isListening, audioLevel]);

  const baseOpacity = isActive ? 0.38 : isListening ? 0.15 : 0.02;

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
      <div
        className="relative w-full h-48 flex items-end justify-center gap-1 px-8"
        style={{
          filter: `blur(${isActive ? tokens.blur.spectral : tokens.blur.ghost})`,
        }}
      >
        {waves.map((wave, i) => (
          <div
            key={i}
            className="flex-1 bg-white rounded-t-sm origin-bottom"
            style={{
              height: `${wave * 100}%`,
              opacity: baseOpacity + wave * 0.2,
              transition: `all ${isActive ? tokens.motion.timing.fast : tokens.motion.timing.breath} ${tokens.motion.easing.liquidWeight}`,
              transitionDelay: `${i * 8}ms`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
