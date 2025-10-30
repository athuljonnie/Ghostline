import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    watch: {
      usePolling: true, // Enable polling for Docker on Windows
      interval: 100,
    },
    hmr: {
      host: 'localhost',
      port: 5173,
    },
  },
});
