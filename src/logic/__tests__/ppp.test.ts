import { describe, expect, it } from 'vitest';
import { evaluerSession } from '../evaluation';
import { ajouterSuggestion, construirePpp, ressourcesKit } from '../ppp';
import { creerSession, reduireSession, type Action, type Session } from '../session';
import { orientationReelle, scoresReels, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

const tranche = tranche4550Reelle();
const scores = scoresReels();
const orientation = orientationReelle();
const max = orientation.decisionPartagee.prioritesMax;

function session(...actions: Action[]): Session {
  return actions.reduce(
    (s, a) => reduireSession(s, a, tranche.mapping.regles),
    creerSession({ dateRdv: '2026-11-13', dateNaissance: '1978-03-02', genre: 'F', age: 48, trancheId: '45-50' }),
  );
}
const ppp = (s: Session) => construirePpp(s, evaluerSession(s, tranche, scores), tranche, scores, orientation);
const prio = (thematique: string): Action => ({ type: 'priorite', thematique, choisie: true, max });

describe('PPP pré-rempli depuis le kit d’orientation (M13)', () => {
  it('priorité « Tabac » : ressources 3989, CSAPA et substituts nicotiniques', () => {
    const [l] = ppp(session(prio('addictions')));
    expect(l).toMatchObject({ thematique: 'addictions', libelle: 'Tabac, alcool et autres addictions', dOffice: false, freins: '', conseils: '' });
    expect(l!.ressources).toContain('Orientation : Tabac Info Service (3989)');
    expect(l!.ressources).toContain('Orientation : CSAPA et CAARUD');
    expect(l!.ressources).toContain('Prescriptions : Substituts nicotiniques');
  });
  it('chaque cellule reste modifiable, la modification est conservée', () => {
    const s = session(prio('addictions'), { type: 'cellulePpp', thematique: 'addictions', colonne: 'ressources', texte: 'Tabac Info Service (3989)' },
      { type: 'cellulePpp', thematique: 'addictions', colonne: 'freins', texte: 'Peur de grossir' });
    const [l] = ppp(s);
    expect(l).toMatchObject({ ressources: 'Tabac Info Service (3989)', freins: 'Peur de grossir' });
    expect(l!.ressourcesKit).toContain('3989');
  });
  it('suggestions : freins du livret p. 37 et conseils patient de l’autoquestionnaire', () => {
    const [l] = ppp(session(prio('addictions')));
    expect(l!.suggestionsFreins).toContain('Échecs antérieurs');
    expect(l!.suggestionsConseils).toEqual([
      'Arrêter le tabac : Utiliser des substituts nicotiniques et se faire aider par un professionnel de santé.',
      'Maîtriser l’alcool : 2 verres par jour, soit 10 par semaine, au maximum avec 2 jours sans alcool.',
    ]);
  });
  it('thématique absente du kit pharmacien (ménopause) : ressources vides, signalée', () => {
    const [l] = ppp(session(prio('menopause')));
    expect(l).toMatchObject({ ressources: '', sansKit: true });
  });
  it('lignes dans l’ordre des priorités', () =>
    expect(ppp(session(prio('sommeil'), prio('addictions'))).map((l) => l.thematique)).toEqual(['sommeil', 'addictions']));
});

describe('Ajout d’office « Bien-être mental et social » (M10)', () => {
  const idees: Action = { type: 'repondre', question: 'Q44', valeur: ['idees'] };
  it('idées suicidaires : ligne ajoutée d’office avec le 31 14, hors priorités', () => {
    const s = session(prio('addictions'), prio('sommeil'), idees);
    const lignes = ppp(s);
    expect(lignes.map((l) => [l.thematique, l.dOffice])).toEqual([['addictions', false], ['sommeil', false], ['bien-etre-mental-social', true]]);
    expect(lignes[2]!.ressources).toMatch(/31 14/);
    expect(lignes[2]!.motif).toMatch(/idées suicidaires/);
  });
  it('déjà choisie comme priorité : pas de doublon, motif indiqué', () => {
    const lignes = ppp(session(prio('bien-etre-mental-social'), idees));
    expect(lignes).toHaveLength(1);
    expect(lignes[0]).toMatchObject({ dOffice: false, motif: expect.stringMatching(/idées suicidaires/) });
  });
  it('sans idées suicidaires : pas d’ajout', () => expect(ppp(session())).toEqual([]));
});

describe('Outils', () => {
  it('ajouterSuggestion : nouvelle ligne, sans doublon', () => {
    expect(ajouterSuggestion('', 'A')).toBe('A');
    expect(ajouterSuggestion('A', 'B')).toBe('A\nB');
    expect(ajouterSuggestion('A\nB', 'B')).toBe('A\nB');
  });
  it('ressourcesKit : null hors kit', () => expect(ressourcesKit('chlordecone', orientation)).toBeNull());
  it('chaque thématique du kit a au moins une ressource pharmacien', () => {
    for (const t of orientation.kit.thematiques) expect(ressourcesKit(t.thematique, orientation)).not.toBe('');
  });
});

describe('Entretien motivationnel (S1)', () => {
  it('6 stades du livret p. 37, balance à 4 cases recommandée au stade « intention »', () => {
    const e = orientation.entretienMotivationnel;
    expect(e.stades.map((s) => s.id)).toEqual(['preintention', 'intention', 'preparation', 'action', 'maintien', 'resolution']);
    expect(e.balance.cases).toHaveLength(4);
    expect(e.balance.stadesRecommandes).toEqual(['intention']);
  });
  it('stade et balance enregistrés par thématique', () => {
    const s = session({ type: 'stade', thematique: 'addictions', stade: 'intention' }, { type: 'balance', thematique: 'addictions', case: 'avantages-changer', texte: 'Respirer mieux' });
    expect(s.decision.entretiens.addictions).toEqual({ stade: 'intention', balance: { 'avantages-changer': 'Respirer mieux' } });
  });
});
