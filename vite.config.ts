/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Mode développement : harnais index.html + src/main.tsx.
// Mode build : bibliothèque (brique) exposant manifest, mount et unmount,
// avec react et react-dom externalisés (fournis par le shell hôte).
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/brick.tsx'),
      formats: ['es'],
      fileName: 'brick',
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'],
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
  },
});
