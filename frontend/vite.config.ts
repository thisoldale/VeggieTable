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
  },
  server: {
    host: true, // This makes the Vite server accessible from outside the container via IP
    port: 8444, // Matches the internal port Vite listens on
    watch: {
      usePolling: true // Needed for hot-reloading in Docker containers on some OS
    },
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        // No rewrite rule needed if backend routes are under /api as well,
        // but if your backend routes are at the root (e.g., /token),
        // you need to rewrite.
        // For this project, the backend routes are at the root.
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});