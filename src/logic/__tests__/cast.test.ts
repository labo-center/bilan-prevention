import { describe, expect, it } from 'vitest';
import { calculerCast } from '../cast';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().cast;
const oui = (n: number) => Object.fromEntries(cfg.items.map((it, i) => [it.id, i < n]));

describe('CAST (M8)', () => {
  it('2 « oui » : intervention brève', () =>
    expect(calculerCast(oui(2), cfg)).toMatchObject({ score: 2, interpretation: { niveau: 'orange', message: expect.stringMatching(/intervention brève/) } }));
  it('3 « oui » : consultation d’addictologie', () =>
    expect(calculerCast(oui(3), cfg)).toMatchObject({ score: 3, interpretation: { niveau: 'rouge', message: expect.stringMatching(/addictologie/) } }));
  it.each([[0, 'aucun'], [1, 'info'], [2, 'orange'], [3, 'rouge'], [6, 'rouge']])('%i oui : %s', (n, niveau) =>
    expect(calculerCast(oui(n), cfg)).toMatchObject({ complet: true, interpretation: { niveau } }));
  it('1 « oui » : information minimale', () =>
    expect(calculerCast(oui(1), cfg)).toMatchObject({ interpretation: { message: expect.stringMatching(/information minimale/) } }));
  it('réponse manquante : incomplet', () => expect(calculerCast({ q1: true }, cfg)).toMatchObject({ complet: false }));
});
