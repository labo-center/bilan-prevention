// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { BrickProvider, type BrickContext } from '../../context';
import { configParDefaut } from '../../config';
import { creerMemoryClient } from '../../data/memoryClient';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

afterEach(cleanup);

let ctx: BrickContext;
beforeEach(() => {
  ctx = { config: configParDefaut, data: creerMemoryClient(), ai: null, user: null, theme: 'clair' };
  render(
    <BrickProvider value={ctx}>
      <App chargement={chargerReferentiels(lireReferentielsReels())} />
    </BrickProvider>,
  );
  fireEvent.change(screen.getByLabelText('Date du rendez-vous'), { target: { value: '2026-11-13' } });
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1978-03-02' } });
  fireEvent.click(screen.getByLabelText('Femme'));
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
});

/** Onglet numéroté de la navigation (« 2. Fiche de repérage »), distinct du bouton « Étape suivante ». */
const etape = (nom: RegExp) =>
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Étapes du bilan' })).getByRole('button', { name: nom }));
const question = (id: string) => screen.getByRole('group', { name: new RegExp(`^${id} - `) });

describe('Autoquestionnaire (M2)', () => {
  it('affiche tous les libellés du référentiel, identiques au PDF officiel', () => {
    const tranche = tranche4550Reelle();
    for (const q of tranche.autoquestionnaire.sections.flatMap((s) => s.questions)) {
      if (q.afficherSi) continue;
      const titre = `${q.id === 'Q46bis' ? 'Q46 bis' : q.id} - ${q.libelle}`;
      expect(screen.getAllByText(titre, { exact: true }).length, titre).toBeGreaterThan(0);
    }
    expect(within(question('Q4')).getByText('Aidez-vous une personne de manière régulière et fréquente, en raison de son âge, de la maladie ou d’une situation de handicap ?')).toBeTruthy();
  });

  it('valider avec 0 réponse : la session reste valide et les étapes suivantes s’ouvrent', () => {
    etape(/Fiche de repérage/);
    expect(screen.getByRole('heading', { name: 'Fiche d’aide au repérage des risques' })).toBeTruthy();
    etape(/Tests cliniques/);
    etape(/Risques repérés/);
    expect(screen.getByRole('heading', { name: 'Risques repérés' })).toBeTruthy();
  });

  it('question conditionnelle : Q3 n’apparaît qu’après « Oui » à Q2', () => {
    expect(screen.queryByRole('group', { name: /^Q3 - / })).toBeNull();
    fireEvent.click(within(question('Q2')).getByLabelText('Oui'));
    expect(question('Q3')).toBeTruthy();
  });

  it('option exclusive : « Aucune » décoche les maladies', () => {
    const q7 = question('Q7');
    fireEvent.click(within(q7).getByLabelText('Cancers'));
    fireEvent.click(within(q7).getByLabelText('Aucune'));
    expect((within(q7).getByLabelText('Cancers') as HTMLInputElement).checked).toBe(false);
  });
});

describe('Fiche de repérage pré-remplie (M3)', () => {
  it('« Oui » à « Rôle d’aidant » : case cochée et marquée « Déclaré par le patient »', () => {
    fireEvent.click(within(question('Q4')).getByLabelText('Oui'));
    etape(/Fiche de repérage/);
    const champ = document.querySelector('[data-champ="role-aidant"]') as HTMLElement;
    expect((within(champ).getByRole('checkbox') as HTMLInputElement).checked).toBe(true);
    expect(within(champ).getByText('Déclaré par le patient')).toBeTruthy();
  });

  it('modification par le professionnel : la marque « déclaré » disparaît', () => {
    fireEvent.click(within(question('Q4')).getByLabelText('Oui'));
    etape(/Fiche de repérage/);
    const champ = document.querySelector('[data-champ="role-aidant"]') as HTMLElement;
    fireEvent.click(within(champ).getByRole('checkbox'));
    expect(within(champ).queryByText('Déclaré par le patient')).toBeNull();
  });

  it('PHQ-4 : réponses Q40 à Q43 rappelées à côté du champ', () => {
    fireEvent.click(within(question('Q40')).getByLabelText('Plusieurs jours'));
    etape(/Fiche de repérage/);
    const champ = document.querySelector('[data-champ="phq4"]') as HTMLElement;
    expect(within(champ).getByText(/Q40 : Plusieurs jours/)).toBeTruthy();
  });
});

describe('Alertes', () => {
  it('idées suicidaires déclarées : bandeau rouge 31 14 sur toutes les étapes (M10)', () => {
    fireEvent.click(within(question('Q44')).getByLabelText('Oui, des idées noires/suicidaires'));
    expect(screen.getByTestId('bandeau-3114').textContent).toMatch(/31 14/);
    etape(/Tests cliniques/);
    expect(screen.getByTestId('bandeau-3114')).toBeTruthy();
  });

  it('PA 182/100 : alerte rouge bloquante, étape « Risques » inaccessible avant acquittement (M5)', () => {
    etape(/Tests cliniques/);
    for (const i of [1, 2]) {
      fireEvent.change(screen.getByLabelText(`Systolique mesure ${i}`), { target: { value: '182' } });
      fireEvent.change(screen.getByLabelText(`Diastolique mesure ${i}`), { target: { value: '100' } });
    }
    expect(screen.getByTestId('alerte-bloquante-pa').textContent).toMatch(/urgences/);
    const risques = screen.getByRole('button', { name: /4\. Risques repérés/ }) as HTMLButtonElement;
    expect(risques.disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Acquitter l’alerte' }));
    expect(risques.disabled).toBe(false);
  });

  it('IMC : taille et poids déclarés → 26,1 (M4) ; taille absente → non calculable', () => {
    etape(/Tests cliniques/);
    expect(screen.getByTestId('imc').textContent).toMatch(/non calculable/);
    etape(/Autoquestionnaire/);
    fireEvent.change(screen.getByLabelText('Q11 - Taille :'), { target: { value: '1.75' } });
    fireEvent.change(screen.getByLabelText('Q12 - Poids :'), { target: { value: '80' } });
    etape(/Tests cliniques/);
    expect(screen.getByTestId('imc').textContent).toBe('IMC = 26,1');
  });

  it('dépistages femme 48 ans : col seulement (M11)', () => {
    etape(/Tests cliniques/);
    const ids = [...document.querySelectorAll('[data-depistage]')].map((e) => e.getAttribute('data-depistage'));
    expect(ids).toEqual(['col']);
  });
});

describe('Données de session', () => {
  it('les réponses restent en mémoire uniquement (aucun stockage navigateur)', () => {
    fireEvent.click(within(question('Q4')).getByLabelText('Oui'));
    expect(ctx.data.taille()).toBe(1);
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});
