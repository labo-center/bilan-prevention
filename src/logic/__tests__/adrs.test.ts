import { describe, expect, it } from 'vitest';
import { calculerAdrs } from '../adrs';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().adrs;
const vrai = (n: number) => Object.fromEntries(cfg.items.map((it, i) => [it.id, i < n]));

describe('ADRS', () => {
  it.each([
    [0, 'Absence de souffrance psychologique'], [3, 'Absence de souffrance psychologique'],
    [4, 'État de souffrance psychologique'], [6, 'État de souffrance psychologique'],
    [7, 'État de dépression'], [10, 'État de dépression'],
  ])('%i « vrai » : %s', (n, message) => expect(calculerAdrs(vrai(n), cfg)).toMatchObject({ complet: true, score: n, interpretation: { message } }));
  it('réponse manquante : incomplet', () => expect(calculerAdrs({}, cfg)).toMatchObject({ complet: false }));
});
