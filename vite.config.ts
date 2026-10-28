import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // The lazy 3D chunk is mostly three.js (~140 kB gzip) and only loads when the product section is near view.
    chunkSizeWarningLimit: 600,
  },
});
