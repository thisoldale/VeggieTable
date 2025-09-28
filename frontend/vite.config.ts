// frontend/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));


export default defineConfig(({ mode }) => {
  // Load env variables from .env files
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
      'import.meta.env.VITE_APP_BUILD_DATE': JSON.stringify(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })),
    },
    server: {
      host: true,
      port: 8444,
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': {
          target: env.VITE_APP_BACKEND_URL || 'http://backend:8000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          ws: true,
        },
      },
    },
  };
});