/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Fiches thématiques officielles (PDF de 3,7 Mo) : servies en développement et copiées au build
 * à côté de la brique, plutôt qu'inlinées en base64 dans brick.js.
 */
const FICHES = resolve(import.meta.dirname, 'docs/sources/fiches_thematiques_synthetiques_mon_bilan_prevention.pdf');
const NOM_FICHES = 'fiches-thematiques.pdf';
function fichesThematiques(): Plugin {
  return {
    name: 'mbp-fiches-thematiques',
    configureServer(server) {
      server.middlewares.use(`/${NOM_FICHES}`, (_req, res) => {
        res.setHeader('Content-Type', 'application/pdf');
        res.end(readFileSync(FICHES));
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: NOM_FICHES, source: readFileSync(FICHES) });
    },
  };
}

// Mode développement : harnais index.html + src/main.tsx.
// Mode build : bibliothèque (brique) exposant manifest, mount et unmount,
// avec react et react-dom externalisés (fournis par le shell hôte).
export default defineConfig({
  plugins: [react(), fichesThematiques()],
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
