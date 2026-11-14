/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

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
/**
 * Politique de sécurité du contenu de l'application autonome (checklist sécurité, PRD §8).
 * - aucun script externe ni inline ; 'wasm-unsafe-eval' : moteur de mise en page de @react-pdf (WebAssembly) ;
 * - connect-src 'self' data: blob: : polices et PDF générés localement, aucun appel vers un tiers ;
 * - frame-src 'self' : fiches thématiques servies par l'application.
 */
export const CSP = [
  "default-src 'self'",
  "script-src 'self' 'wasm-unsafe-eval'",
  "style-src 'self'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' data: blob:",
  "worker-src 'self'",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

function cspStricte(): Plugin {
  return {
    name: 'mbp-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html
        .replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`)
        .replace(/<title>.*<\/title>/, '<title>Copilote Mon Bilan Prévention</title>'),
  };
}

/**
 * Deux builds :
 * - par défaut, la brique (bibliothèque) : manifest, mount et unmount, react et react-dom externalisés ;
 * - « app » (npm run build:app), l'application autonome servie depuis le poste de l'officine :
 *   PWA hors ligne (S6), CSP stricte.
 */
export default defineConfig(({ mode }) => {
  const app = mode === 'app';
  return {
    plugins: [
      react(),
      fichesThematiques(),
      ...(app
        ? [
            cspStricte(),
            VitePWA({
              registerType: 'autoUpdate',
              injectRegister: 'script',
              manifest: {
                name: 'Copilote Mon Bilan Prévention',
                short_name: 'Bilan Prévention',
                lang: 'fr',
                start_url: '.',
                display: 'standalone',
                background_color: '#f6f7f9',
                theme_color: '#1f5fa8',
                icons: [{ src: 'icone.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
              },
              workbox: {
                // Fichiers statiques uniquement : aucune donnée de session ne passe par le service worker.
                globPatterns: ['**/*.{js,css,html,svg,ttf,pdf,webmanifest}'],
                maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
                navigateFallback: 'index.html',
                // Prise de contrôle dès la première visite : l'application est prête hors ligne sans recharger.
                clientsClaim: true,
                skipWaiting: true,
              },
            }),
          ]
        : []),
    ],
    publicDir: app ? 'public' : false,
    // Chemins relatifs : l'application peut être servie depuis n'importe quel dossier du poste.
    base: app ? './' : '/',
    build: app
      ? {
          outDir: 'dist-app',
          // Le moteur PDF (~1,2 Mo) est chargé à la demande, au premier export.
          chunkSizeWarningLimit: 1300,
        }
      : {
          lib: { entry: resolve(import.meta.dirname, 'src/brick.tsx'), formats: ['es'], fileName: 'brick' },
          rollupOptions: { external: ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime'] },
        },
    test: {
      environment: 'node',
      include: ['src/**/__tests__/**/*.test.{ts,tsx}'],
    },
  };
});
