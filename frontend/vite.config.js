import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The Express backend (server.js, port 3000 by default) owns /api and /book.
// In dev, Vite proxies those paths through so the React app can call them
// with plain relative fetch("/api/...") calls, no CORS config needed.
// In production, `npm run build` outputs to ../public_dist, which
// server.js serves directly, so there is no proxy at all — same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/book': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../public_dist',
    emptyOutDir: true,
  },
});
