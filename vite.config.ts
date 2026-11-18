import { defineConfig } from 'vite';

// The site is served from https://<user>.github.io/wos-state-hub/, so every link and picture needs that prefix.
// A custom domain later would change this one line to '/'.
export default defineConfig({
  base: '/wos-state-hub/',
  build: { outDir: 'dist', sourcemap: true },
  server: { open: true }
});
