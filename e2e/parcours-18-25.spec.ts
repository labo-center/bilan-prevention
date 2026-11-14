import { expect, test } from '@playwright/test';
import { cloturerEtVerifier, etape, exporterPdf, ouvrirSession, question, saisirMesures, surveillerErreurs } from './outils';

test('parcours 18-25 ans (19 ans) : ADRS, binge drinking, PPP et export', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirSession(page, '2007-05-10', 'Femme', 'Bilan Prévention 18-25 ans');

  await question(page, 'Q2').getByLabel('En cumul étude-emploi').check();
  await question(page, 'Q35').getByLabel('Oui').check();
  await question(page, 'Q37').getByLabel('Oui, du protoxyde d’azote').check();
  await question(page, 'Q47').getByLabel('Mieux dormir').check();

  await etape(page, /Fiche de repérage/);
  await page.getByLabel('Nom et prénom').fill('MARTIN Léa');
  for (const champ of ['etudiant', 'en-emploi', 'binge-drinking', 'protoxyde']) {
    await expect(page.locator(`[data-champ="${champ}"]`).getByRole('checkbox')).toBeChecked();
  }

  await etape(page, /Tests cliniques/);
  await expect(page.getByRole('region', { name: /Échelle HAD/ })).toHaveCount(0);
  const adrs = page.getByRole('region', { name: /Échelle ARDS/ });
  for (let i = 1; i <= 10; i++) await adrs.getByRole('group', { name: new RegExp(`^${i}\\. `) }).getByLabel(i <= 4 ? 'Vrai' : 'Faux').check();
  await expect(page.getByTestId('score-adrs')).toHaveText('Score ADRS : 4');
  await expect(adrs).toContainText('État de souffrance psychologique');
  await saisirMesures(page, 118, 72, '1.65', '58');

  await etape(page, /Décision partagée/);
  await expect(page.locator('[data-risque="adrs"]')).toHaveAttribute('data-niveau', 'orange');
  await expect(page.locator('[data-thematique="sommeil"]')).toContainText('Souhaité par le patient');
  await page.getByRole('checkbox', { name: 'Bien-être mental et social' }).check();

  await etape(page, /Plan personnalisé/);
  await expect(page.locator('[data-ppp="bien-etre-mental-social"]').getByLabel('Ressources et intervenants')).toHaveValue(/31 14/);

  const pages = await exporterPdf(page);
  expect(pages).toHaveLength(2);
  expect(pages[0]).toContain('Fiche d’aide au repérage des risques entre 18 et 25 ans');
  expect(pages[0]).toContain('4 - État de souffrance psychologique');
  expect(pages[0]).toContain('Binge drinking');
  expect(pages[1]).toContain('Référentiel MBP 18-25 v');

  await cloturerEtVerifier(page, 'MARTIN');
  expect(erreurs).toEqual([]);
});
