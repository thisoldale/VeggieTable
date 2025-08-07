// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // This makes the Vite server accessible from outside the container via IP
    port: 8444, // Matches the internal port Vite listens on
    watch: {
      usePolling: true // Needed for hot-reloading in Docker containers on some OS
    },
    proxy: {
      '/api': { // When the browser requests paths starting with /api
        target: 'http://backend:8000', // <-- This is the INTERNAL Docker service URL
        changeOrigin: true, // Changes the origin header to the target URL
        rewrite: (path) => path.replace(/^\/api/, ''), // Rewrites /api/plants to /plants
        // Configure WebSocket proxy if your backend uses WebSockets (e.g., for hot reloading)
        ws: true,
      },
    },
  },
});