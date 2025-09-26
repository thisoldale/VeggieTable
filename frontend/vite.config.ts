// frontend/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));


export default defineConfig({
  plugins: [react()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
    'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(new Date().toLocaleString()),
  },
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