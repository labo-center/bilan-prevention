import { describe, expect, it } from 'vitest';
import { evaluerSession } from '../evaluation';
import { testApplicable } from '../humeur';
import { creerSession, reduireSession, type Action, type Session } from '../session';
import { construireDocument } from '../document';
import { orientationReelle, scoresReels, trancheReelle } from '../../referentiels/__tests__/fixtures';

const scores = scoresReels();

function session(trancheId: string, age: number, genre: string, ...actions: Action[]): Session {
  const tranche = trancheReelle(trancheId);
  return actions.reduce(
    (s, a) => reduireSession(s, a, tranche.mapping.regles),
    creerSession({ dateRdv: '2026-11-13', dateNaissance: '2000-01-01', genre, age, trancheId }),
  );
}
const evaluer = (s: Session) => evaluerSession(s, trancheReelle(s.ouverture.trancheId), scores);

describe('Tests proposés selon la tranche et l’âge', () => {
  it.each([
    ['18-25', 18, ['adrs']], ['18-25', 19, ['adrs']], ['18-25', 20, ['adrs', 'had']], ['18-25', 21, ['had']], ['18-25', 25, ['had']],
    ['45-50', 47, ['had']], ['60-65', 62, ['had']], ['70-75', 72, ['had']],
  ] as const)('%s, %i ans : échelles %j', (t, age, attendu) => {
    const proposes = evaluer(session(t, age, 'F')).testsProposes;
    expect(proposes.filter((x) => x === 'adrs' || x === 'had')).toEqual(attendu);
  });

  it('Amsler « si > 60 ans » : pas à 60 ans, oui à 61', () => {
    expect(testApplicable('amsler', 60, scores)).toBe(false);
    expect(testApplicable('amsler', 61, scores)).toBe(true);
    expect(evaluer(session('60-65', 60, 'H')).testsProposes).not.toContain('amsler');
    expect(evaluer(session('60-65', 61, 'H')).testsProposes).toContain('amsler');
  });

  it('ICOPE et spirométrie : 60-65 et 70-75 ; ni ICOPE ni spirométrie à 18-25', () => {
    expect(evaluer(session('60-65', 62, 'H')).testsProposes).toEqual(expect.arrayContaining(['icope', 'spirometrie']));
    expect(evaluer(session('70-75', 72, 'H')).testsProposes).toEqual(expect.arrayContaining(['icope', 'spirometrie', 'amsler']));
    expect(evaluer(session('18-25', 22, 'H')).testsProposes).not.toEqual(expect.arrayContaining(['icope']));
    expect(evaluer(session('18-25', 22, 'H')).testsProposes).not.toContain('spirometrie');
  });
});

describe('18-25 ans', () => {
  it('ADRS à 19 ans : 7 « vrai » → état de dépression, risque rouge', () => {
    const vrais = Array.from({ length: 10 }, (_, i): Action => ({ type: 'adrs', item: `q${i + 1}`, oui: i < 7 }));
    const ev = evaluer(session('18-25', 19, 'F', ...vrais));
    expect(ev.adrs).toMatchObject({ complet: true, score: 7, interpretation: { message: 'État de dépression' } });
    expect(ev.risques.find((r) => r.id === 'adrs')).toMatchObject({ niveau: 'rouge' });
    expect(ev.had).toEqual([]);
  });
  it('pré-remplissage : cumul étude-emploi, binge drinking, protoxyde d’azote', () => {
    const s = session('18-25', 22, 'H',
      { type: 'repondre', question: 'Q2', valeur: 'cumul' },
      { type: 'repondre', question: 'Q35', valeur: 'oui' },
      { type: 'repondre', question: 'Q37', valeur: ['protoxyde'] });
    expect([s.fiche.etudiant?.valeur, s.fiche['en-emploi']?.valeur, s.fiche['binge-drinking']?.valeur, s.fiche.protoxyde?.valeur]).toEqual([true, true, true, true]);
  });
  it('idées suicidaires (Q45) : alerte 31 14', () =>
    expect(evaluer(session('18-25', 22, 'H', { type: 'repondre', question: 'Q45', valeur: ['idees'] })).ideesSuicidaires).toMatchObject({ niveau: 'rouge' }));
  it('repères alcool (Q34) : risque orange', () =>
    expect(evaluer(session('18-25', 22, 'H', { type: 'repondre', question: 'Q34', valeur: ['plus2ParJour'] })).risques.map((r) => r.id)).toContain('reperes-alcool'));
  it('dépistage du col à 25 ans seulement', () => {
    expect(evaluer(session('18-25', 24, 'F')).depistages).toEqual([]);
    expect(evaluer(session('18-25', 25, 'F')).depistages.map((d) => d.id)).toEqual(['col']);
  });
});

describe('60-65 ans', () => {
  it('Amsler anormal à 62 ans : alerte rouge, ophtalmologue en moins d’une semaine', () => {
    const ev = evaluer(session('60-65', 62, 'H', { type: 'amsler', anormal: true }));
    expect(ev.risques.find((r) => r.id === 'amsler')).toMatchObject({ niveau: 'rouge', message: expect.stringMatching(/moins d’une semaine/) });
  });
  it('Amsler normal : aucun risque', () => expect(evaluer(session('60-65', 62, 'H', { type: 'amsler', anormal: false })).amsler).toBeNull());
  it('ICOPE mobilité en 14 s : domaine positif, orientation médecin traitant « à vérifier »', () => {
    const ev = evaluer(session('60-65', 62, 'H', { type: 'icope', saisie: { mobilite: { cinqLeversRealises: true, tempsSecondes: 14 } } }));
    expect(ev.risques.find((r) => r.id === 'icope')).toMatchObject({ niveau: 'orange', aVerifier: true, theme: 'perte-autonomie', message: expect.stringMatching(/Mobilité/) });
  });
  it('pré-remplissage : pas de contact avec les proches → isolement « à vérifier »', () =>
    expect(session('60-65', 62, 'F', { type: 'repondre', question: 'Q4', valeur: 'non' }).fiche.isolement).toMatchObject({ valeur: true, aVerifier: true }));
  it('repères alcool liés à Q36', () =>
    expect(evaluer(session('60-65', 62, 'F', { type: 'repondre', question: 'Q36', valeur: ['plus10ParSemaine'] })).risques.map((r) => r.id)).toContain('reperes-alcool'));
  it('dépistages femme 62 ans : colorectal, sein, col', () =>
    expect(evaluer(session('60-65', 62, 'F')).depistages.map((d) => d.id)).toEqual(['colorectal', 'sein', 'col']));
});

describe('70-75 ans', () => {
  it('idées suicidaires (Q50) : case ajoutée hors fiche officielle, alerte 31 14 (M10)', () => {
    const tranche = trancheReelle('70-75');
    const champ = tranche.ficheReperage.sections.flatMap((s) => s.champs).find((c) => c.id === 'idees-suicidaires');
    expect(champ).toMatchObject({ horsFicheOfficielle: true, aide: expect.stringMatching(/absente de la fiche officielle/) });
    const ev = evaluer(session('70-75', 72, 'H', { type: 'repondre', question: 'Q50', valeur: ['idees'] }));
    expect(ev.risques[0]).toMatchObject({ id: 'idees-suicidaires', niveau: 'rouge' });
  });
  it('difficultés dans les gestes du quotidien (Q25) → perte d’autonomie « à vérifier »', () =>
    expect(session('70-75', 72, 'F', { type: 'repondre', question: 'Q25', valeur: ['marcher'] }).fiche['perte-autonomie']).toMatchObject({ valeur: true, aVerifier: true }));
  it('logement non adapté aux chutes (Q32) → risque de chute', () =>
    expect(session('70-75', 72, 'F', { type: 'repondre', question: 'Q32', valeur: 'non' }).fiche['risque-chute']).toMatchObject({ valeur: true }));
  it('dépistages : colorectal et sein jusqu’à 74 ans, plus rien à 75', () => {
    expect(evaluer(session('70-75', 74, 'F')).depistages.map((d) => d.id)).toEqual(['colorectal', 'sein']);
    expect(evaluer(session('70-75', 75, 'F')).depistages).toEqual([]);
  });
  it('thème grands caractères recommandé', () => expect(trancheReelle('70-75').affichage?.themeRecommande).toBe('contraste'));
  it('document : résultats ICOPE et Amsler, ADRS absente', () => {
    const tranche = trancheReelle('70-75');
    const s = session('70-75', 72, 'F',
      { type: 'amsler', anormal: false },
      { type: 'icope', saisie: { vision: { problemeYeux: true }, mobilite: { cinqLeversRealises: true, tempsSecondes: 10 } } });
    const m = construireDocument(s, evaluer(s), tranche, scores, orientationReelle(), '2026-11-14');
    const r = m.resultatsTests.lignes;
    expect(r.find((l) => l.libelle.startsWith('Grille d’Amsler'))?.valeur).toBe('Grille normale');
    expect(r.find((l) => l.libelle.includes('ICOPE'))?.valeur).toMatch(/^Domaine\(s\) positif\(s\) : Vision - non évalué\(s\) : Cognition, Nutrition, Audition, Psychologie/);
    expect(r.some((l) => l.libelle.includes('ARDS'))).toBe(false);
  });
});
