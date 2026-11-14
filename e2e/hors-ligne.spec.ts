import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * S6 et M14 sur le build de production : après un premier chargement, le réseau est coupé ;
 * une session complète jusqu'à l'export PDF fonctionne, sous CSP stricte, sans aucune donnée persistée.
 */

const etape = (page: Page, nom: RegExp) => page.getByRole('navigation', { name: 'Étapes du bilan' }).getByRole('button', { name: nom }).click();

async function texteDuPdf(chemin: string): Promise<string[]> {
  const doc = await getDocument({ data: new Uint8Array(await readFile(chemin)), useSystemFonts: false, verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  return pages;
}

test('session complète hors ligne jusqu’à l’export PDF, puis purge', async ({ page, context }) => {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });

  // 1er chargement en ligne : le service worker met en cache les fichiers statiques.
  await page.goto('./');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });

  // Réseau coupé.
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Ouvrir la session' })).toBeVisible();

  await page.getByLabel('Date du rendez-vous').fill('2026-11-13');
  await page.getByLabel('Date de naissance').fill('1978-03-02');
  await page.getByLabel('Femme').check();
  await page.getByRole('button', { name: 'Ouvrir la session' }).click();
  await page.getByRole('group', { name: /^Q34 - / }).getByLabel('Oui, je fume').check();

  await etape(page, /Fiche de repérage/);
  await page.getByLabel('Nom et prénom').fill('DUPONT Marie');

  await etape(page, /Tests cliniques/);
  await page.getByRole('spinbutton', { name: 'Taille' }).fill('1.75');
  await page.getByRole('spinbutton', { name: 'Poids' }).fill('80');
  for (const i of [1, 2]) {
    await page.getByLabel(`Systolique mesure ${i}`).fill('145');
    await page.getByLabel(`Diastolique mesure ${i}`).fill('85');
  }

  await etape(page, /Décision partagée/);
  await page.getByRole('checkbox', { name: 'Tabac, alcool et autres addictions' }).check();

  await etape(page, /Plan personnalisé/);
  await page.getByLabel('Je m’oppose à ce que ce document soit communiqué à mon médecin traitant.').check();

  // Fiche thématique servie depuis le cache, hors ligne.
  const fiche = await page.evaluate(async () => (await fetch('fiches-thematiques.pdf')).status);
  expect(fiche).toBe(200);

  await etape(page, /Clôture et export/);
  const telechargement = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter le PDF' }).click();
  const fichier = await telechargement;
  expect(fichier.suggestedFilename()).toBe('bilan-prevention-45-50-2026-11-13.pdf');
  const chemin = await fichier.path();
  const pages = await texteDuPdf(chemin);
  expect(pages).toHaveLength(2);
  expect(pages[0]).toContain('Fiche d’aide au repérage des risques entre 45 et 50 ans');
  expect(pages[0]).toContain('DUPONT Marie');
  expect(pages[0]).toContain('Si PA ≥ 140/90 mmHg');
  expect(pages[1]).toContain('Tabac Info Service (3989)');
  expect(pages[1]).toContain('Le patient s’oppose à la transmission au médecin traitant.');
  for (const p of pages) expect(p).toMatch(/Référentiel MBP 45-50 v\d+\.\d+\.\d+, scores v\d+\.\d+\.\d+, orientation v\d+\.\d+\.\d+ - non validé par le pharmacien référent - édité le \d{2}\/\d{2}\/\d{4}/);
  await expect(page.getByRole('status').filter({ hasText: 'PDF généré' })).toBeVisible();

  // Clôture : plus aucune donnée patient à l'écran ni dans le navigateur (M15).
  await page.getByRole('button', { name: 'Clôturer la session' }).last().click();
  await expect(page.getByRole('button', { name: 'Ouvrir la session' })).toBeVisible();
  const etat = await page.evaluate(async () => {
    const urls: string[] = [];
    for (const nom of await caches.keys()) for (const r of await (await caches.open(nom)).keys()) urls.push(r.url);
    return {
      html: document.body.innerHTML.includes('DUPONT'),
      local: localStorage.length,
      session: sessionStorage.length,
      cookies: document.cookie,
      bases: (await indexedDB.databases()).map((d) => d.name),
      cache: urls,
    };
  });
  expect(etat).toMatchObject({ html: false, local: 0, session: 0, cookies: '', bases: [] });
  // Le cache du service worker ne contient que les fichiers statiques de l'application.
  for (const u of etat.cache) expect(u).toMatch(/\.(js|css|html|svg|ttf|pdf|webmanifest)(\?.*)?$/);

  // Aucune erreur, y compris aucune violation de la CSP.
  expect(erreurs).toEqual([]);
});
