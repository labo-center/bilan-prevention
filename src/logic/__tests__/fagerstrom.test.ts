import { describe, expect, it } from 'vitest';
import { calculerFagerstrom, pointsCigarettesParJour } from '../fagerstrom';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().fagerstrom;

describe('Fagerström simplifié (M7)', () => {
  it('15 cig/j (1) et première cigarette à 10 min (2) : score 3, dépendance modérée', () => {
    const r = calculerFagerstrom({ cigarettesParJour: pointsCigarettesParJour(15, cfg)!, delaiPremiereCigarette: 2 }, cfg);
    expect(r).toMatchObject({ complet: true, score: 3, interpretation: { niveau: 'orange', message: 'Dépendance modérée' } });
  });
  describe('cas limites', () => {
    it.each([
      [0, 0, 'Pas de dépendance'], [1, 0, 'Pas de dépendance'], [0, 2, 'Dépendance modérée'],
      [1, 2, 'Dépendance modérée'], [1, 3, 'Dépendance forte'], [3, 3, 'Dépendance forte'],
    ])('%i + %i : %s', (a, b, message) => {
      expect(calculerFagerstrom({ cigarettesParJour: a, delaiPremiereCigarette: b }, cfg)).toMatchObject({ interpretation: { message } });
    });
  });
  it.each([[0, 0], [10, 0], [11, 1], [20, 1], [21, 2], [30, 2], [31, 3], [60, 3]])('%i cigarettes/jour : %i point(s)', (n, p) => {
    expect(pointsCigarettesParJour(n, cfg)).toBe(p);
  });
  it.each([-1, 2.5, Number.NaN])('nombre de cigarettes invalide (%s) : null', (n) => expect(pointsCigarettesParJour(n, cfg)).toBeNull());
  it('réponse manquante : incomplet', () =>
    expect(calculerFagerstrom({ cigarettesParJour: 1 }, cfg)).toEqual({ complet: false, manquants: ['delaiPremiereCigarette'] }));
});
