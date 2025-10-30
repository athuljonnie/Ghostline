/**
 * Design tokens for the voice interface
 */

export const tokens = {
  colors: {
    void: '#000000',
    structureDeep: '#0A0A0A',
    structureMid: '#131313',
    signalPassive: 'rgba(255, 255, 255, 0.06)',
    signalActive: 'rgba(255, 255, 255, 0.19)',
    ghostGlowIdle: 'rgba(255, 255, 255, 0.02)',
    ghostGlowActive: 'rgba(255, 255, 255, 0.38)',
  },

  typography: {
    fontFamily: '"Space Mono", "IBM Plex Mono", monospace',
    weights: {
      light: 300,
      regular: 400,
    },
    lineHeight: 1.4,
    letterSpacing: {
      idle: '0.01em',
      active: '0.03em',
    },
  },

  motion: {
    timing: {
      instant: '80ms',
      fast: '150ms',
      breath: '800ms',
      dissolve: '1200ms',
    },
    easing: {
      liquidWeight: 'cubic-bezier(0.22, 1.0, 0.36, 1.0)',
    },
  },

  blur: {
    ghost: '40px',
    spectral: '60px',
  },

  spacing: {
    chamber: '6vw',
    structural: '2rem',
  },
} as const;

export const API_CONFIG = {
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8000',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  WS_ENDPOINT: '/ws/assistant',
} as const;
