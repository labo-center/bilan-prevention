import { expect, test } from '@playwright/test';
import { cloturerEtVerifier, etape, exporterPdf, ouvrirSession, question, saisirMesures, surveillerErreurs } from './outils';

test('parcours 70-75 ans (72 ans) : grands caractères, idées suicidaires hors fiche, ICOPE et export', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirSession(page, '1954-05-10', 'Femme', 'Bilan Prévention 70-75 ans');

  // Thème grands caractères activé d'office (C3) : le texte est plus grand qu'en thème clair.
  const bascule = page.getByRole('button', { name: 'Grands caractères' });
  await expect(bascule).toHaveAttribute('aria-pressed', 'true');
  const taille = () => page.getByRole('heading', { name: 'Autoquestionnaire' }).evaluate((e) => parseFloat(getComputedStyle(e.closest('[data-theme]')!).fontSize));
  const grande = await taille();
  await bascule.click();
  expect(await taille()).toBeLessThan(grande);
  await bascule.click();

  await question(page, 'Q25').getByLabel('Marcher seul(e) avec ou sans béquille, canne…').check();
  await question(page, 'Q32').getByLabel('Non').check();
  await question(page, 'Q50').getByLabel('Oui, des idées noires/suicidaires').check();
  await expect(page.getByTestId('bandeau-3114')).toContainText('31 14');

  await etape(page, /Fiche de repérage/);
  await page.getByLabel('Nom et prénom').fill('PETIT Jeanne');
  const idees = page.locator('[data-champ="idees-suicidaires"]');
  await expect(idees.getByRole('checkbox')).toBeChecked();
  await expect(idees.getByText('hors fiche officielle')).toBeVisible();
  await expect(page.locator('[data-champ="perte-autonomie"]').getByRole('checkbox')).toBeChecked();
  await expect(page.locator('[data-champ="risque-chute"]').getByRole('checkbox')).toBeChecked();

  await etape(page, /Tests cliniques/);
  await page.locator('[data-domaine="vision"]').getByLabel('Oui').check();
  await page.getByLabel('Grille normale').check();
  await saisirMesures(page, 135, 82, '1.60', '55');

  await etape(page, /Décision partagée/);
  await expect(page.locator('[data-risque]').first()).toHaveAttribute('data-risque', 'idees-suicidaires');
  await page.getByRole('checkbox', { name: 'Prévention de la perte d’autonomie' }).check();

  await etape(page, /Plan personnalisé/);
  await expect(page.locator('[data-ppp]')).toHaveCount(2);
  await expect(page.locator('[data-ppp="bien-etre-mental-social"]')).toContainText('Ajouté d’office');

  const pages = await exporterPdf(page);
  expect(pages).toHaveLength(2);
  expect(pages[0]).toContain('Fiche d’aide au repérage des risques entre 70 et 75 ans');
  expect(pages[0]).toContain('Domaine(s) positif(s) : Vision');
  expect(pages[0]).toContain('Grille normale');
  expect(pages[1]).toContain('Référentiel MBP 70-75 v');

  await cloturerEtVerifier(page, 'PETIT');
  expect(erreurs).toEqual([]);
});
