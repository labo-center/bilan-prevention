import { describe, expect, it } from 'vitest';
import { calculerFace } from '../face';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().face;
/** Réponses atteignant un score donné : q1 et q2 (0-4) puis q3-q5 (0 ou 4). */
function reponses(score: number): Record<string, number> {
  const r: Record<string, number> = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0 };
  let reste = score;
  for (const id of ['q3', 'q4', 'q5']) if (reste >= 4 && reste - 4 >= 0) { r[id] = 4; reste -= 4; }
  r.q1 = Math.min(4, reste); reste -= r.q1;
  r.q2 = Math.min(4, reste); reste -= r.q2;
  if (reste !== 0) throw new Error(`score ${score} non constructible`);
  return r;
}

describe('FACE (M6)', () => {
  it('homme, score 6 : consommation excessive probable, intervention brève', () => {
    const r = calculerFace(reponses(6), 'H', cfg);
    expect(r).toMatchObject({ complet: true, score: 6, interpretation: { niveau: 'orange' } });
    expect(r.complet && r.interpretation.message).toBe('Consommation excessive probable : intervention brève');
  });
  it('femme, score 4 : même message', () => {
    const r = calculerFace(reponses(4), 'F', cfg);
    expect(r.complet && r.interpretation.message).toBe('Consommation excessive probable : intervention brève');
  });
  it('score 9 : dépendance probable, consultation d’addictologie', () => {
    for (const g of ['H', 'F']) {
      const r = calculerFace(reponses(9), g, cfg);
      expect(r.complet && r.interpretation.message).toBe('Dépendance probable : proposer une consultation d’addictologie');
    }
  });

  describe('cas limites', () => {
    it.each([
      ['H', 4, 'info'], ['H', 5, 'orange'],
      ['F', 3, 'info'], ['F', 4, 'orange'],
      ['H', 8, 'orange'], ['H', 9, 'rouge'],
      ['F', 8, 'orange'], ['F', 9, 'rouge'],
      ['H', 0, 'info'], ['F', 20, 'rouge'],
    ])('%s score %i : %s', (g, score, niveau) => {
      expect(calculerFace(reponses(score), g, cfg)).toMatchObject({ complet: true, score, interpretation: { niveau } });
    });
  });

  it('genre non renseigné : seuils femmes appliqués et signalés', () => {
    const r = calculerFace(reponses(4), 'NSP', cfg);
    expect(r).toMatchObject({ complet: true, grille: 'F', interpretation: { niveau: 'orange' } });
    expect(r.complet && r.avertissementGenre).toMatch(/seuils femmes/);
  });
  it('genre renseigné : aucun avertissement', () =>
    expect(calculerFace(reponses(4), 'H', cfg)).toMatchObject({ grille: 'H', avertissementGenre: null }));
  it('réponse manquante : incomplet, items listés', () =>
    expect(calculerFace({ q1: 2, q2: 1 }, 'H', cfg)).toEqual({ complet: false, manquants: ['q3', 'q4', 'q5'] }));
  it('valeur non prévue par le référentiel : erreur explicite', () =>
    expect(() => calculerFace({ ...reponses(0), q3: 2 }, 'H', cfg)).toThrow(/q3/));
});
