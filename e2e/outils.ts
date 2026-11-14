import { readFile } from 'node:fs/promises';
import { expect, type Page } from '@playwright/test';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';

export const question = (page: Page, id: string) => page.getByRole('group', { name: new RegExp(`^${id.replace('bis', ' bis')} - `) });
export const etape = (page: Page, nom: RegExp) =>
  page.getByRole('navigation', { name: 'Étapes du bilan' }).getByRole('button', { name: nom }).click();

/** Collecte les erreurs de page et de console (dont les violations de CSP). */
export function surveillerErreurs(page: Page): string[] {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  return erreurs;
}

export async function ouvrirSession(page: Page, dateNaissance: string, genre: 'Femme' | 'Homme', titre: string) {
  await page.goto('/');
  await page.getByLabel('Date du rendez-vous').fill('2026-11-13');
  await page.getByLabel('Date de naissance').fill(dateNaissance);
  await page.getByLabel(genre).check();
  await page.getByRole('button', { name: 'Ouvrir la session' }).click();
  await expect(page.getByRole('heading', { name: titre })).toBeVisible();
}

export async function saisirMesures(page: Page, systolique: number, diastolique: number, taille = '1.70', poids = '70') {
  await page.getByRole('spinbutton', { name: 'Taille' }).fill(taille);
  await page.getByRole('spinbutton', { name: 'Poids' }).fill(poids);
  for (const i of [1, 2]) {
    await page.getByLabel(`Systolique mesure ${i}`).fill(String(systolique));
    await page.getByLabel(`Diastolique mesure ${i}`).fill(String(diastolique));
  }
}

/** Exporte le PDF depuis l'étape de clôture et renvoie le texte de chaque page. */
export async function exporterPdf(page: Page): Promise<string[]> {
  await etape(page, /Clôture et export/);
  const telechargement = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exporter le PDF' }).click();
  const chemin = await (await telechargement).path();
  const doc = await getDocument({ data: new Uint8Array(await readFile(chemin)), useSystemFonts: false, verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const c = await (await doc.getPage(i)).getTextContent();
    pages.push(c.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  return pages;
}

/** Clôture puis vérifie qu'aucune donnée ne reste à l'écran ni dans le navigateur. */
export async function cloturerEtVerifier(page: Page, temoin: string) {
  await page.getByRole('button', { name: 'Clôturer la session' }).first().click();
  await expect(page.getByRole('button', { name: 'Ouvrir la session' })).toBeVisible();
  const etat = await page.evaluate((t) => ({ html: document.body.innerHTML.includes(t), local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }), temoin);
  expect(etat).toEqual({ html: false, local: 0, session: 0, cookies: '' });
}
