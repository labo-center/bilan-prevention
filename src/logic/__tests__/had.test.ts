import { describe, expect, it } from 'vitest';
import { calculerHad } from '../had';
import { echellesHumeurApplicables } from '../humeur';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const scores = scoresReels();
const cfg = scores.had;

/** Répartit un total sur les 7 items d'une dimension (0-3 chacun). */
function repartir(dimension: string, total: number): Record<string, number> {
  const r: Record<string, number> = {};
  let reste = total;
  for (const it of cfg.items.filter((i) => i.dimension === dimension)) {
    r[it.id] = Math.min(3, reste);
    reste -= r[it.id]!;
  }
  return r;
}

describe('HAD (M9)', () => {
  it('A et D sont calculés sur les items impairs et pairs', () => {
    const impairs = cfg.items.filter((i) => i.dimension === 'A').map((i) => Number(i.id.slice(1)));
    expect(impairs).toEqual([1, 3, 5, 7, 9, 11, 13]);
  });
  it('total A = 9 : symptomatologie douteuse ; total D = 12 : symptomatologie certaine', () => {
    const [a, d] = calculerHad({ ...repartir('A', 9), ...repartir('D', 12) }, cfg);
    expect(a).toMatchObject({ dimension: 'A', score: 9, interpretation: { message: 'Symptomatologie douteuse' } });
    expect(d).toMatchObject({ dimension: 'D', score: 12, interpretation: { message: 'Symptomatologie certaine' } });
  });
  describe('cas limites (chaque dimension)', () => {
    it.each([
      [7, 'aucun'], [8, 'orange'], [10, 'orange'], [11, 'rouge'], [0, 'aucun'], [21, 'rouge'],
    ])('score %i : %s', (score, niveau) => {
      for (const dim of ['A', 'D']) {
        const autre = dim === 'A' ? 'D' : 'A';
        const r = calculerHad({ ...repartir(dim, score), ...repartir(autre, 0) }, cfg).find((x) => x.dimension === dim);
        expect(r).toMatchObject({ complet: true, score, interpretation: { niveau } });
      }
    });
  });
  it('dimension incomplète : l’autre reste calculée', () => {
    const [a, d] = calculerHad(repartir('A', 5), cfg);
    expect(a).toMatchObject({ complet: true, score: 5 });
    expect(d).toMatchObject({ complet: false });
  });
  it('les options sont cotées selon le livret (item 2 inversé)', () => {
    const q2 = cfg.items.find((i) => i.id === 'q2')!;
    expect(q2.options.map((o) => o.points)).toEqual([0, 1, 2, 3]);
    const q1 = cfg.items.find((i) => i.id === 'q1')!;
    expect(q1.options.map((o) => o.points)).toEqual([3, 2, 1, 0]);
  });
});

describe('Échelle anxio-dépressive selon l’âge (livret p. 34)', () => {
  it.each([
    [18, ['adrs']], [19, ['adrs']], [20, ['adrs', 'had']], [21, ['had']], [47, ['had']], [17, []],
  ])('%i ans : %j', (age, attendu) => expect(echellesHumeurApplicables(age, scores)).toEqual(attendu));
});
