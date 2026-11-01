import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    server: {
      // In development the page calls /api on its own origin and Vite forwards it to
      // the local backend, so no CORS setup is needed. Ignored when VITE_API_URL is set.
      proxy: env.VITE_API_URL ? undefined : { '/api': env.API_PROXY_TARGET || 'http://localhost:3001' },
    },
    build: {
      // The lazy 3D chunk is mostly three.js (~140 kB gzip) and only loads when the product section is near view.
      chunkSizeWarningLimit: 600,
    },
  };
});
