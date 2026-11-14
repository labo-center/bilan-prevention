import { expect, test } from '@playwright/test';
import { cloturerEtVerifier, etape, exporterPdf, ouvrirSession, question, saisirMesures, surveillerErreurs } from './outils';

test('parcours 60-65 ans (62 ans) : Amsler, ICOPE, PPP et export', async ({ page }) => {
  const erreurs = surveillerErreurs(page);
  await ouvrirSession(page, '1964-05-10', 'Homme', 'Bilan Prévention 60-65 ans');

  await question(page, 'Q4').getByLabel('Non').check();
  await question(page, 'Q41').getByLabel('Plutôt négatif').check();
  await question(page, 'Q51').getByLabel('Mieux connaitre / comprendre / prévenir les effets du vieillissement').check();

  await etape(page, /Fiche de repérage/);
  await page.getByLabel('Nom et prénom').fill('BERNARD Paul');
  const isolement = page.locator('[data-champ="isolement"]');
  await expect(isolement.getByRole('checkbox')).toBeChecked();
  await expect(isolement.getByText('à vérifier')).toBeVisible();
  await expect(page.locator('[data-champ="retraite-mal-vecue"]').getByRole('textbox')).toHaveValue('Plutôt négatif');

  await etape(page, /Tests cliniques/);
  await page.getByLabel('Lignes déformées, ondulées ou taches sombres').check();
  await expect(page.getByTestId('amsler')).toContainText('ophtalmologue (moins d’une semaine)');
  const mobilite = page.locator('[data-domaine="mobilite"]');
  await mobilite.getByLabel('Oui').check();
  await mobilite.getByLabel('Temps en sec').fill('15');
  await expect(mobilite).toHaveAttribute('data-statut', 'positif');
  await saisirMesures(page, 128, 80);

  await etape(page, /Décision partagée/);
  await expect(page.locator('[data-risque="amsler"]')).toHaveAttribute('data-niveau', 'rouge');
  await expect(page.locator('[data-risque="icope"]')).toContainText('Mobilité');
  await page.getByRole('checkbox', { name: 'Prévention de la perte d’autonomie' }).check();

  await etape(page, /Plan personnalisé/);
  await expect(page.locator('[data-ppp="perte-autonomie"]').getByLabel('Ressources et intervenants')).toHaveValue(/ICOPE MONITOR/);

  const pages = await exporterPdf(page);
  expect(pages).toHaveLength(2);
  expect(pages[0]).toContain('Fiche d’aide au repérage des risques entre 60 et 65 ans');
  expect(pages[0]).toContain('Anomalie - Lignes déformées');
  expect(pages[0]).toContain('Domaine(s) positif(s) : Mobilité');
  expect(pages[1]).toContain('Référentiel MBP 60-65 v');

  await cloturerEtVerifier(page, 'BERNARD');
  expect(erreurs).toEqual([]);
});
