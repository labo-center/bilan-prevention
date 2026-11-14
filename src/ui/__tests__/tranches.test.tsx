// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { BrickProvider, type BrickContext } from '../../context';
import { configParDefaut } from '../../config';
import { creerMemoryClient } from '../../data/memoryClient';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels, trancheReelle } from '../../referentiels/__tests__/fixtures';

afterEach(cleanup);

/** Ouvre une session au 13/11/2026 pour une date de naissance donnée. */
function ouvrir(dateNaissance: string, genre = 'Femme') {
  const ctx: BrickContext = { config: configParDefaut, data: creerMemoryClient(), ai: null, user: null, theme: 'clair' };
  const { container } = render(
    <BrickProvider value={ctx}>
      <App chargement={chargerReferentiels(lireReferentielsReels())} />
    </BrickProvider>,
  );
  fireEvent.change(screen.getByLabelText('Date du rendez-vous'), { target: { value: '2026-11-13' } });
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: dateNaissance } });
  fireEvent.click(screen.getByLabelText(genre));
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
  return container;
}
const etape = (nom: RegExp) =>
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Étapes du bilan' })).getByRole('button', { name: nom }));
const sectionsTests = () => screen.getAllByRole('region').map((r) => r.getAttribute('aria-labelledby'));

describe.each([
  ['18-25', '2004-05-10', 22],
  ['60-65', '1964-05-10', 62],
  ['70-75', '1954-05-10', 72],
])('Tranche %s', (id, naissance, age) => {
  it(`${age} ans : la tranche ${id} est chargée`, () => {
    ouvrir(naissance);
    expect(screen.getByRole('heading', { name: `Bilan Prévention ${id} ans` })).toBeTruthy();
  });

  it('autoquestionnaire : tous les libellés du référentiel, identiques au PDF officiel (M2)', () => {
    ouvrir(naissance);
    for (const q of trancheReelle(id).autoquestionnaire.sections.flatMap((s) => s.questions)) {
      if (q.afficherSi) continue;
      const titre = `${q.id.replace('bis', ' bis')} - ${q.libelle}`;
      expect(screen.getAllByText(titre, { exact: true }).length, titre).toBeGreaterThan(0);
    }
  });

  it('fiche de repérage : toutes les sections officielles', () => {
    ouvrir(naissance);
    etape(/Fiche de repérage/);
    for (const s of trancheReelle(id).ficheReperage.sections) expect(screen.getByRole('heading', { name: s.titre })).toBeTruthy();
  });
});

describe('Tests cliniques selon l’âge', () => {
  it('19 ans : ADRS proposée, pas la HAD', () => {
    ouvrir('2007-05-10');
    etape(/Tests cliniques/);
    expect(sectionsTests()).toContain('test-adrs');
    expect(sectionsTests()).not.toContain('test-had');
  });
  it('22 ans : HAD proposée, pas l’ADRS', () => {
    ouvrir('2004-05-10');
    etape(/Tests cliniques/);
    expect(sectionsTests()).toContain('test-had');
    expect(sectionsTests()).not.toContain('test-adrs');
  });
  it('60 ans : pas de grille d’Amsler ; ICOPE proposé', () => {
    ouvrir('1966-05-10');
    etape(/Tests cliniques/);
    expect(sectionsTests()).not.toContain('test-amsler');
    expect(sectionsTests()).toContain('test-icope');
  });
  it('62 ans : grille d’Amsler anormale → alerte rouge', () => {
    ouvrir('1964-05-10', 'Homme');
    etape(/Tests cliniques/);
    fireEvent.click(screen.getByLabelText('Lignes déformées, ondulées ou taches sombres'));
    expect(screen.getByTestId('amsler').textContent).toMatch(/ophtalmologue \(moins d’une semaine\)/);
  });
  it('72 ans : ICOPE mobilité non réalisée → domaine positif et orientation', () => {
    ouvrir('1954-05-10');
    etape(/Tests cliniques/);
    const mobilite = document.querySelector('[data-domaine="mobilite"]') as HTMLElement;
    fireEvent.click(within(mobilite).getByLabelText('Non'));
    expect(mobilite.getAttribute('data-statut')).toBe('positif');
    expect(screen.getByTestId('icope').textContent).toMatch(/médecin traitant/);
  });
});

describe('Thème grands caractères (C3)', () => {
  it('70-75 ans : activé d’office, désactivable', () => {
    const conteneur = ouvrir('1954-05-10');
    const racine = conteneur.firstElementChild as HTMLElement;
    const bascule = screen.getByRole('button', { name: 'Grands caractères' });
    expect(racine.getAttribute('data-theme')).toBe('contraste');
    expect(bascule.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(bascule);
    expect(racine.getAttribute('data-theme')).toBe('clair');
  });
  it('45-50 ans : thème de l’hôte conservé, activable à la demande', () => {
    const conteneur = ouvrir('1979-05-10');
    const racine = conteneur.firstElementChild as HTMLElement;
    expect(racine.getAttribute('data-theme')).toBe('clair');
    fireEvent.click(screen.getByRole('button', { name: 'Grands caractères' }));
    expect(racine.getAttribute('data-theme')).toBe('contraste');
  });
});

describe('70-75 : case « Idées suicidaires » hors fiche officielle', () => {
  it('signalée à l’écran et cochée par la déclaration du patient', () => {
    ouvrir('1954-05-10');
    fireEvent.click(within(screen.getByRole('group', { name: /^Q50 - / })).getByLabelText('Oui, des idées noires/suicidaires'));
    expect(screen.getByTestId('bandeau-3114')).toBeTruthy();
    etape(/Fiche de repérage/);
    const champ = document.querySelector('[data-champ="idees-suicidaires"]') as HTMLElement;
    expect((within(champ).getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    expect(within(champ).getByText('hors fiche officielle')).toBeTruthy();
  });
});
