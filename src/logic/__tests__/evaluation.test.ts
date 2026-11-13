import { describe, expect, it } from 'vitest';
import { evaluerSession } from '../evaluation';
import { creerSession, reduireSession, type Action, type Session } from '../session';
import { scoresReels, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';
import { trierRisques, type Risque } from '../risques';

const tranche = tranche4550Reelle();
const scores = scoresReels();
const regles = tranche.mapping.regles;

function session(genre = 'F', age = 47, ...actions: Action[]): Session {
  return actions.reduce(
    (s, a) => reduireSession(s, a, regles),
    creerSession({ dateRdv: '2026-11-13', dateNaissance: '1979-05-10', genre, age, trancheId: '45-50' }),
  );
}
const pa = (sys: number, dia: number): Action => ({
  type: 'pa',
  lignes: [{ bras: 'gauche', systolique: sys, diastolique: dia }, { bras: 'gauche', systolique: sys, diastolique: dia }],
});
const ids = (s: Session) => evaluerSession(s, tranche, scores).risques.map((r) => r.id);

describe('Évaluation de la session', () => {
  it('session vide (0 réponse) : valide, aucun risque hors rappel de dépistage', () => {
    const ev = evaluerSession(session('F', 47), tranche, scores);
    expect(ev.risques.map((r) => r.id)).toEqual(['depistage-col']);
    expect(ev.imc).toEqual({ calculable: false, raison: 'poids-manquant' });
  });

  it('IMC calculé depuis la taille et le poids déclarés (M4)', () => {
    const s = session('H', 47, { type: 'repondre', question: 'Q11', valeur: 1.75 }, { type: 'repondre', question: 'Q12', valeur: 80 });
    expect(evaluerSession(s, tranche, scores).imc).toMatchObject({ calculable: true, imc: 26.1 });
  });

  it('PA 182/100 : alerte rouge bloquante jusqu’à acquittement (M5)', () => {
    const s = session('H', 47, pa(182, 100));
    const ev = evaluerSession(s, tranche, scores);
    expect(ev.risques[0]).toMatchObject({ id: 'pa', niveau: 'rouge', bloquant: true });
    expect(ev.alertesBloquantes.map((r) => r.id)).toEqual(['pa']);
    const acquittee = reduireSession(s, { type: 'acquitter', alerte: 'pa' }, regles);
    expect(evaluerSession(acquittee, tranche, scores).alertesBloquantes).toEqual([]);
    expect(evaluerSession(acquittee, tranche, scores).risques[0]?.id).toBe('pa');
  });

  it('PA 145/85 : orange, non bloquante', () => {
    const ev = evaluerSession(session('H', 47, pa(145, 85)), tranche, scores);
    expect(ev.risques.find((r) => r.id === 'pa')).toMatchObject({ niveau: 'orange', bloquant: false });
    expect(ev.alertesBloquantes).toEqual([]);
  });

  it('idées suicidaires déclarées : risque rouge 31 14, thématique bien-être mental (M10)', () => {
    const ev = evaluerSession(session('F', 47, { type: 'repondre', question: 'Q44', valeur: ['idees'] }), tranche, scores);
    expect(ev.ideesSuicidaires).toMatchObject({ niveau: 'rouge' });
    const r = ev.risques.filter((x) => x.id === 'idees-suicidaires');
    expect(r).toHaveLength(1); // règle et case de la fiche dédoublonnées
    expect(r[0]).toMatchObject({ niveau: 'rouge', theme: 'bien-etre-mental-social', message: expect.stringMatching(/31 14/) });
  });

  it('repères alcool dépassés (Q33) : risque orange', () => {
    const s = session('H', 47, { type: 'repondre', question: 'Q33', valeur: ['plus10ParSemaine'] });
    expect(evaluerSession(s, tranche, scores).risques.find((r) => r.id === 'reperes-alcool')).toMatchObject({ niveau: 'orange' });
  });

  it('dépistages femme 48 ans : col seulement (M11)', () =>
    expect(ids(session('F', 48)).filter((i) => i.startsWith('depistage'))).toEqual(['depistage-col']));
  it('dépistages femme 50 ans : colorectal, sein, col', () =>
    expect(ids(session('F', 50)).filter((i) => i.startsWith('depistage'))).toEqual(['depistage-colorectal', 'depistage-sein', 'depistage-col']));
  it('case « risque élevé colorectal » de la fiche : coloscopie à la place du test', () => {
    const s = session('H', 47, { type: 'champ', champ: 'expl-colorectal-risque', valeur: true });
    expect(evaluerSession(s, tranche, scores).depistages).toEqual([expect.objectContaining({ id: 'colorectal', type: 'risque-eleve' })]);
  });

  it('polymédication : 11 traitements → orange, un seul risque', () => {
    const s = session('H', 47, { type: 'champ', champ: 'nombre-traitements', valeur: 11 }, { type: 'champ', champ: 'polymedication', valeur: true });
    const r = evaluerSession(s, tranche, scores).risques.filter((x) => x.id === 'polymedication');
    expect(r).toEqual([expect.objectContaining({ niveau: 'orange' })]);
  });

  it('pas de médecin traitant : rappel du signalement à la CPAM', () => {
    const s = session('H', 47, { type: 'champ', champ: 'medecin-traitant', valeur: 'non' });
    expect(evaluerSession(s, tranche, scores).risques.find((r) => r.id === 'medecin-traitant')).toMatchObject({ theme: 'acces-droits' });
  });

  it('FACE femme 4, HAD A=9 : risques orange avec la dimension précisée', () => {
    const actions: Action[] = [
      { type: 'face', item: 'q1', points: 4 }, ...['q2', 'q3', 'q4', 'q5'].map((item) => ({ type: 'face' as const, item, points: 0 })),
      ...['q1', 'q3', 'q5'].map((item) => ({ type: 'had' as const, item, points: 3 })),
      ...['q7', 'q9', 'q11', 'q13'].map((item) => ({ type: 'had' as const, item, points: 0 })),
    ];
    const ev = evaluerSession(session('F', 47, ...actions), tranche, scores);
    expect(ev.risques.find((r) => r.id === 'face')).toMatchObject({ niveau: 'orange' });
    expect(ev.risques.find((r) => r.id === 'had-A')).toMatchObject({ niveau: 'orange', message: 'Anxiété (total A) : Symptomatologie douteuse' });
  });

  it('cases de la fiche cochées : risques « info » avec leur origine', () => {
    const ev = evaluerSession(session('F', 47, { type: 'repondre', question: 'Q4', valeur: 'oui' }), tranche, scores);
    expect(ev.risques.find((r) => r.id === 'role-aidant')).toMatchObject({ niveau: 'info', source: 'Déclaré par le patient', theme: 'bien-etre-mental-social' });
  });

  it('tri rouge > orange > info (M12)', () => {
    const s = session('F', 50, pa(182, 100),
      { type: 'repondre', question: 'Q4', valeur: 'oui' },
      { type: 'repondre', question: 'Q33', valeur: ['plus2ParJour'] },
      { type: 'repondre', question: 'Q44', valeur: ['idees'] });
    const niveaux = evaluerSession(s, tranche, scores).risques.map((r) => r.niveau);
    expect(niveaux.length).toBeGreaterThanOrEqual(5);
    expect(niveaux).toEqual([...niveaux].sort((a, b) => ['rouge', 'orange', 'info'].indexOf(a) - ['rouge', 'orange', 'info'].indexOf(b)));
    expect(niveaux.slice(0, 2)).toEqual(['rouge', 'rouge']);
  });

  it('trierRisques est stable à niveau égal', () => {
    const r = (id: string, niveau: Risque['niveau']): Risque => ({ id, niveau, theme: 't', source: 's', message: id, aVerifier: false, bloquant: false });
    expect(trierRisques([r('a', 'info'), r('b', 'rouge'), r('c', 'info'), r('d', 'orange')]).map((x) => x.id)).toEqual(['b', 'd', 'a', 'c']);
  });
});

describe('Réducteur de session', () => {
  it('modification par le professionnel : origine « saisi_professionnel »', () => {
    const s = session('F', 47, { type: 'repondre', question: 'Q4', valeur: 'oui' }, { type: 'champ', champ: 'role-aidant', valeur: false });
    expect(s.fiche['role-aidant']).toMatchObject({ valeur: false, origine: 'saisi_professionnel' });
  });
  it('réponse effacée : retirée des réponses', () => {
    const s = session('F', 47, { type: 'repondre', question: 'Q7', valeur: ['cancers'] }, { type: 'repondre', question: 'Q7', valeur: [] });
    expect(s.autoquestionnaire.reponses).toEqual({});
  });
  it('acquittement idempotent', () => {
    const s = session('F', 47, { type: 'acquitter', alerte: 'pa' }, { type: 'acquitter', alerte: 'pa' });
    expect(s.tests.acquittements).toEqual(['pa']);
  });
});
