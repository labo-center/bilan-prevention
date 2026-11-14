import { describe, expect, it } from 'vitest';
import { thematiquesAPrioriser, thematiquesSouhaitees } from '../decision';
import { basculerPriorite, creerSession, reduireSession, type Action } from '../session';
import type { Risque } from '../risques';
import { orientationReelle, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

const tranche = tranche4550Reelle();
const max = orientationReelle().decisionPartagee.prioritesMax;
const risque = (id: string, theme: string, niveau: Risque['niveau']): Risque => ({ id, theme, niveau, source: '', message: id, aVerifier: false, bloquant: false });

describe('Choix des priorités (M12)', () => {
  it('le référentiel limite à 2 priorités (livret p. 12)', () => expect(max).toBe(2));
  it('1re et 2e priorités acceptées', () => {
    const a = basculerPriorite([], 'addictions', true, max);
    const b = basculerPriorite(a.priorites, 'sommeil', true, max);
    expect(b).toEqual({ priorites: ['addictions', 'sommeil'], refus: false });
  });
  it('3e priorité refusée, sélection inchangée', () =>
    expect(basculerPriorite(['addictions', 'sommeil'], 'alimentation', true, max)).toEqual({ priorites: ['addictions', 'sommeil'], refus: true }));
  it('retirer une priorité libère une place', () =>
    expect(basculerPriorite(['addictions', 'sommeil'], 'addictions', false, max).priorites).toEqual(['sommeil']));
  it('re-cocher une priorité déjà choisie : sans effet', () =>
    expect(basculerPriorite(['addictions'], 'addictions', true, max)).toEqual({ priorites: ['addictions'], refus: false }));
  it('le réducteur applique le refus', () => {
    const actions: Action[] = ['addictions', 'sommeil', 'alimentation'].map((thematique) => ({ type: 'priorite', thematique, choisie: true, max }));
    const s = actions.reduce((acc, a) => reduireSession(acc, a, []), creerSession({ dateRdv: '2026-11-13', dateNaissance: '1978-03-02', genre: 'F', age: 48, trancheId: '45-50' }));
    expect(s.decision.priorites).toEqual(['addictions', 'sommeil']);
  });
});

describe('Thématiques proposées', () => {
  it('regroupe les risques par thématique, triées par niveau le plus grave', () => {
    const r = thematiquesAPrioriser(
      [risque('a', 'sommeil', 'info'), risque('b', 'addictions', 'orange'), risque('c', 'maladies-chroniques', 'rouge'), risque('d', 'addictions', 'info')],
      [],
    );
    expect(r.map((t) => [t.thematique, t.niveauMax, t.nbRisques])).toEqual([
      ['maladies-chroniques', 'rouge', 1], ['addictions', 'orange', 2], ['sommeil', 'info', 1],
    ]);
  });
  it('les souhaits du patient sans risque viennent en dernier, marqués', () => {
    const r = thematiquesAPrioriser([risque('a', 'sommeil', 'info')], ['menopause', 'sommeil']);
    expect(r).toEqual([
      { thematique: 'sommeil', niveauMax: 'info', nbRisques: 1, souhaitee: true },
      { thematique: 'menopause', niveauMax: null, nbRisques: 0, souhaitee: true },
    ]);
  });
  it('Q46 : « Améliorer mon alimentation et bouger plus » → alimentation et activité physique, sans doublon', () =>
    expect(thematiquesSouhaitees({ Q46: ['alimentation-bouger', 'ecran', 'tabac'] }, tranche.souhaitsPatient)).toEqual(['alimentation', 'activite-physique', 'addictions']));
  it('Q46 sans réponse : aucun souhait', () => expect(thematiquesSouhaitees({}, tranche.souhaitsPatient)).toEqual([]));
});
