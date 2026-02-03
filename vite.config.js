import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Essential for Electron to find assets using relative paths
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 5173
  }
});