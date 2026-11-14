import { defineConfig, devices } from '@playwright/test';

const PORT_DEV = 5179;
const PORT_APP = 5180;
const tablette = { ...devices['Galaxy Tab S4'], browserName: 'chromium' as const };

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: 'list',
  use: { trace: 'off' },
  projects: [
    // Harnais de développement : parcours complet.
    { name: 'tablette', testMatch: 'parcours-*.spec.ts', use: { ...tablette, baseURL: `http://localhost:${PORT_DEV}` } },
    // Build de production (npm run build:app) : CSP stricte, service worker, hors ligne.
    { name: 'hors-ligne', testMatch: 'hors-ligne.spec.ts', use: { ...tablette, baseURL: `http://localhost:${PORT_APP}`, acceptDownloads: true } },
  ],
  webServer: [
    { command: `npx vite --port ${PORT_DEV} --strictPort`, url: `http://localhost:${PORT_DEV}`, reuseExistingServer: false },
    { command: `npx vite preview --mode app --port ${PORT_APP} --strictPort`, url: `http://localhost:${PORT_APP}`, reuseExistingServer: false },
  ],
});
