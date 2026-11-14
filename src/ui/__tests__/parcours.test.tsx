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
      const titre = `${q.id.replace('bis', ' bis')} - ${q.libelle}`;
      expect(screen.getAllByText(titre, { exact: true }).length, titre).toBeGreaterThan(0);
    }
    expect(within(question('Q4')).getByText('Aidez-vous une personne de manière régulière et fréquente, en raison de son âge, de la maladie ou d’une situation de handicap ?')).toBeTruthy();
  });

  it('valider avec 0 réponse : la session reste valide et les étapes suivantes s’ouvrent', () => {
    etape(/Fiche de repérage/);
    expect(screen.getByRole('heading', { name: 'Fiche d’aide au repérage des risques' })).toBeTruthy();
    etape(/Tests cliniques/);
    etape(/Décision partagée/);
    expect(screen.getByRole('heading', { name: 'Risques repérés' })).toBeTruthy();
    etape(/Plan personnalisé/);
    expect(screen.getByText(/Aucune priorité choisie/)).toBeTruthy();
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

  it('PA 182/100 : alerte rouge bloquante, décision partagée inaccessible avant acquittement (M5)', () => {
    etape(/Tests cliniques/);
    for (const i of [1, 2]) {
      fireEvent.change(screen.getByLabelText(`Systolique mesure ${i}`), { target: { value: '182' } });
      fireEvent.change(screen.getByLabelText(`Diastolique mesure ${i}`), { target: { value: '100' } });
    }
    expect(screen.getByTestId('alerte-bloquante-pa').textContent).toMatch(/urgences/);
    const decision = screen.getByRole('button', { name: /4\. Décision partagée/ }) as HTMLButtonElement;
    const plan = screen.getByRole('button', { name: /5\. Plan personnalisé/ }) as HTMLButtonElement;
    expect([decision.disabled, plan.disabled]).toEqual([true, true]);
    fireEvent.click(screen.getByRole('button', { name: 'Acquitter l’alerte' }));
    expect([decision.disabled, plan.disabled]).toEqual([false, false]);
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

describe('Décision partagée et PPP (incrément 4)', () => {
  /** Prépare des risques sur 3 thématiques : tabac, sommeil, alimentation (IMC). */
  function preparer() {
    fireEvent.click(within(question('Q34')).getByLabelText('Oui, je fume'));
    fireEvent.click(within(question('Q38')).getByLabelText('Oui, souvent'));
    fireEvent.click(within(question('Q26')).getByLabelText('Plusieurs fois par jour'));
    fireEvent.click(within(question('Q46')).getByLabelText('Améliorer mon alimentation et bouger plus'));
    etape(/Décision partagée/);
  }
  const priorite = (nom: string) => screen.getByRole('checkbox', { name: nom }) as HTMLInputElement;

  it('pas plus de 2 priorités (M12)', () => {
    preparer();
    fireEvent.click(priorite('Tabac, alcool et autres addictions'));
    fireEvent.click(priorite('Sommeil'));
    expect(priorite('Alimentation').disabled).toBe(true);
    expect(screen.getByText(/2 priorités choisies/)).toBeTruthy();
    fireEvent.click(priorite('Sommeil'));
    expect(priorite('Alimentation').disabled).toBe(false);
  });

  it('souhait du patient (Q46) proposé et signalé', () => {
    preparer();
    const ligne = document.querySelector('[data-thematique="activite-physique"]') as HTMLElement;
    expect(within(ligne).getByText('Souhaité par le patient')).toBeTruthy();
  });

  it('stade « Intention » : balance décisionnelle à 4 cases (S1)', () => {
    preparer();
    fireEvent.click(priorite('Tabac, alcool et autres addictions'));
    const entretien = document.querySelector('[data-entretien="addictions"]') as HTMLElement;
    expect(within(entretien).queryByRole('group', { name: 'Balance décisionnelle' })).toBeNull();
    fireEvent.click(within(entretien).getByLabelText(/Intention \(contemplation\)/));
    const balance = within(entretien).getByRole('group', { name: 'Balance décisionnelle' });
    expect(within(balance).getAllByRole('textbox')).toHaveLength(4);
    expect(within(entretien).getByText('Avez-vous déjà envisagé d’arrêter de fumer ?')).toBeTruthy();
  });

  it('priorité « Tabac » : ressources pré-remplies 3989, CSAPA, substituts nicotiniques, modifiables (M13)', () => {
    preparer();
    fireEvent.click(priorite('Tabac, alcool et autres addictions'));
    etape(/Plan personnalisé/);
    const ligne = document.querySelector('[data-ppp="addictions"]') as HTMLElement;
    const ressources = within(ligne).getByLabelText('Ressources et intervenants') as HTMLTextAreaElement;
    expect(ressources.value).toContain('Tabac Info Service (3989)');
    expect(ressources.value).toContain('CSAPA et CAARUD');
    expect(ressources.value).toContain('Substituts nicotiniques');
    expect((within(ligne).getByLabelText('Freins rencontrés') as HTMLTextAreaElement).value).toBe('');
    fireEvent.change(ressources, { target: { value: 'Tabac Info Service (3989)' } });
    expect((within(ligne).getByLabelText('Ressources et intervenants') as HTMLTextAreaElement).value).toBe('Tabac Info Service (3989)');
  });

  it('suggestion cliquée ajoutée à la cellule « Conseils »', () => {
    preparer();
    fireEvent.click(priorite('Tabac, alcool et autres addictions'));
    etape(/Plan personnalisé/);
    const ligne = document.querySelector('[data-ppp="addictions"]') as HTMLElement;
    const conseils = within(ligne).getByLabelText('Conseils, modalités pratiques').closest('div') as HTMLElement;
    fireEvent.click(within(conseils).getByRole('button', { name: /Suggestions/ }));
    fireEvent.click(within(conseils).getByRole('button', { name: /Arrêter le tabac/ }));
    expect((within(ligne).getByLabelText('Conseils, modalités pratiques') as HTMLTextAreaElement).value).toMatch(/^Arrêter le tabac : Utiliser des substituts nicotiniques/);
  });

  it('idées suicidaires : « Bien-être mental et social » ajouté d’office au PPP (M10)', () => {
    fireEvent.click(within(question('Q44')).getByLabelText('Oui, des idées noires/suicidaires'));
    etape(/Plan personnalisé/);
    const ligne = document.querySelector('[data-ppp="bien-etre-mental-social"]') as HTMLElement;
    expect(within(ligne).getByText(/Ajouté d’office/)).toBeTruthy();
    expect((within(ligne).getByLabelText('Ressources et intervenants') as HTMLTextAreaElement).value).toMatch(/31 14/);
  });

  it('fiche thématique « Sommeil » ouverte en panneau latéral à la page 11, sans quitter la session (S5)', () => {
    preparer();
    fireEvent.click(within(document.querySelector('[data-thematique="sommeil"]') as HTMLElement).getByRole('button', { name: 'Ouvrir la fiche thématique Sommeil' }));
    const panneau = screen.getByRole('complementary', { name: 'Fiche thématique : Sommeil' });
    expect(within(panneau).getByTitle(/Sommeil/).getAttribute('src')).toBe('fiches-thematiques.pdf#page=11');
    expect(screen.getByRole('heading', { name: 'Décision partagée' })).toBeTruthy();
    fireEvent.click(within(panneau).getByRole('button', { name: 'Fermer la fiche' }));
    expect(screen.queryByRole('complementary')).toBeNull();
  });
});
