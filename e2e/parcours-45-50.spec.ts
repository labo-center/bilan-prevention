import { expect, test, type Page } from '@playwright/test';

/** Parcours complet 45-50 ans : ouverture → autoquestionnaire → fiche → tests → décision partagée → PPP. */

const question = (page: Page, id: string) => page.getByRole('group', { name: new RegExp(`^${id} - `) });

test('parcours 45-50 ans de bout en bout jusqu’au PPP', async ({ page }) => {
  const erreurs: string[] = [];
  page.on('pageerror', (e) => erreurs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') erreurs.push(m.text()); });
  const horsLocal: string[] = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://localhost')) horsLocal.push(r.url()); });

  await page.goto('/');

  // 1. Ouverture de session : femme de 48 ans.
  await page.getByLabel('Date du rendez-vous').fill('2026-11-13');
  await page.getByLabel('Date de naissance').fill('1978-03-02');
  await page.getByLabel('Femme').check();
  await page.getByRole('button', { name: 'Ouvrir la session' }).click();
  await expect(page.getByRole('heading', { name: 'Bilan Prévention 45-50 ans' })).toBeVisible();
  await expect(page.getByText('48 ans')).toBeVisible();

  // 2. Autoquestionnaire rempli par la patiente.
  await question(page, 'Q4').getByLabel('Oui').check();
  await page.getByLabel('Q11 - Taille :').fill('1.75');
  await page.getByLabel('Q12 - Poids :').fill('80');
  await question(page, 'Q33').getByLabel('Vous buvez plus de 10 verres standards par semaine').check();
  await question(page, 'Q34').getByLabel('Oui, je fume').check();
  await question(page, 'Q44').getByLabel('Oui, des idées noires/suicidaires').check();
  await expect(page.getByTestId('bandeau-3114')).toContainText('31 14');

  // 3. Fiche de repérage pré-remplie.
  await page.getByRole('button', { name: 'Étape suivante : Fiche de repérage' }).click();
  const aidant = page.locator('[data-champ="role-aidant"]');
  await expect(aidant.getByRole('checkbox')).toBeChecked();
  await expect(aidant.getByText('Déclaré par le patient')).toBeVisible();
  await expect(page.locator('[data-champ="idees-suicidaires"]').getByRole('checkbox')).toBeChecked();
  await expect(page.locator('[data-champ="tabac"]').getByRole('checkbox')).toBeChecked();
  await page.locator('[data-champ="medecin-traitant"]').getByLabel('Oui').check();

  // 4. Tests cliniques.
  await page.getByRole('button', { name: 'Étape suivante : Tests cliniques' }).click();
  await expect(page.getByTestId('imc')).toHaveText('IMC = 26,1');

  for (const i of [1, 2]) {
    await page.getByLabel(`Systolique mesure ${i}`).fill('182');
    await page.getByLabel(`Diastolique mesure ${i}`).fill('100');
  }
  await expect(page.getByTestId('alerte-bloquante-pa')).toContainText('urgences');
  await expect(page.getByRole('button', { name: 'Étape suivante : Décision partagée' })).toBeDisabled();
  await page.getByRole('button', { name: 'Acquitter l’alerte' }).click();
  await expect(page.getByTestId('alerte-bloquante-pa')).toHaveCount(0);

  // FACE : 4 points chez une femme → consommation excessive probable.
  const face = page.getByRole('region', { name: /questionnaire FACE/ });
  await face.getByRole('group', { name: /^1\. / }).getByLabel(/Quatre fois par semaine ou plus/).check();
  for (const n of [3, 4, 5]) await face.getByRole('group', { name: new RegExp(`^${n}\\. `) }).getByLabel('Non').check();
  await face.getByRole('group', { name: /^2\. / }).getByLabel(/^1 ou 2/).check();
  await expect(page.getByTestId('score-face')).toHaveText('Score FACE : 4');
  await expect(face).toContainText('Consommation excessive probable : intervention brève');

  // Fagerström : 15 cigarettes/jour + 10 minutes → 3, dépendance modérée.
  const fag = page.getByRole('region', { name: /Fagerström/ });
  await fag.getByLabel('Aide : nombre de cigarettes par jour').fill('15');
  await fag.getByLabel('6 à 30 minutes').check();
  await expect(page.getByTestId('score-fagerstrom')).toHaveText('Score : 3');
  await expect(fag).toContainText('Dépendance modérée');

  // Dépistages : femme 48 ans → col seulement.
  await expect(page.locator('[data-depistage]')).toHaveCount(1);
  await expect(page.locator('[data-depistage="col"]')).toBeVisible();

  // 5. Décision partagée : risques repérés, triés rouge > orange > info.
  await page.getByRole('button', { name: 'Étape suivante : Décision partagée' }).click();
  const niveaux = await page.locator('[data-risque]').evaluateAll((els) => els.map((e) => e.getAttribute('data-niveau')));
  expect(niveaux.length).toBeGreaterThanOrEqual(5);
  const rang = { rouge: 0, orange: 1, info: 2 } as Record<string, number>;
  expect(niveaux).toEqual([...niveaux].sort((a, b) => rang[a!]! - rang[b!]!));
  await expect(page.locator('[data-risque="pa"]')).toHaveAttribute('data-niveau', 'rouge');
  await expect(page.locator('[data-risque="idees-suicidaires"]')).toHaveAttribute('data-niveau', 'rouge');
  for (const id of ['face', 'fagerstrom', 'reperes-alcool']) {
    await expect(page.locator(`[data-risque="${id}"]`)).toHaveAttribute('data-niveau', 'orange');
  }
  await expect(page.locator('[data-risque="imc"]')).toContainText('à vérifier');

  // Priorités : 2 au maximum.
  await page.getByRole('checkbox', { name: 'Tabac, alcool et autres addictions' }).check();
  await page.getByRole('checkbox', { name: 'Prévention des autres maladies chroniques' }).check();
  await expect(page.getByRole('checkbox', { name: 'Bien-être mental et social' })).toBeDisabled();

  // Entretien motivationnel : stade « Intention » → balance décisionnelle.
  const entretien = page.locator('[data-entretien="addictions"]');
  await entretien.getByLabel(/Intention \(contemplation\)/).check();
  await expect(entretien.getByRole('group', { name: 'Balance décisionnelle' }).getByRole('textbox')).toHaveCount(4);
  await entretien.getByLabel('Bénéfices perçus à changer').fill('Retrouver du souffle');

  // Fiche thématique en panneau latéral : le PDF officiel est servi.
  const pdf = page.waitForResponse((r) => r.url().includes('fiches-thematiques.pdf'));
  await page.locator('[data-thematique="addictions"]').getByRole('button', { name: /Ouvrir la fiche thématique/ }).click();
  expect((await pdf).status()).toBe(200);
  await expect(page.getByRole('complementary', { name: 'Fiche thématique : Tabac, alcool et autres addictions' })).toBeVisible();
  await page.getByRole('button', { name: 'Fermer la fiche' }).click();

  // 6. PPP : ressources du kit pharmacien, ajout d'office du bien-être mental (idées suicidaires).
  await page.getByRole('button', { name: 'Étape suivante : Plan personnalisé' }).click();
  const tabac = page.locator('[data-ppp="addictions"]');
  const ressources = tabac.getByLabel('Ressources et intervenants');
  await expect(ressources).toHaveValue(/Tabac Info Service \(3989\)/);
  await expect(ressources).toHaveValue(/CSAPA et CAARUD/);
  await expect(ressources).toHaveValue(/Substituts nicotiniques/);
  await tabac.getByLabel('Freins rencontrés').fill('Peur de prendre du poids');
  await expect(page.locator('[data-ppp]')).toHaveCount(3);
  await expect(page.locator('[data-ppp="bien-etre-mental-social"]')).toContainText('Ajouté d’office');
  await page.getByLabel('Modalités de suivi').fill('Point téléphonique dans 1 mois');

  // Aucune donnée dans le stockage du navigateur, aucune requête hors du poste, aucune erreur.
  const stockage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
  expect(stockage).toEqual({ local: 0, session: 0, cookies: '' });
  expect(horsLocal).toEqual([]);
  expect(erreurs).toEqual([]);

  // Clôture : retour à l'écran d'ouverture.
  await page.getByRole('button', { name: 'Clôturer la session' }).first().click();
  await expect(page.getByRole('button', { name: 'Ouvrir la session' })).toBeVisible();
});
