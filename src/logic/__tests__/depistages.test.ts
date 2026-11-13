import { describe, expect, it } from 'vitest';
import { depistagesApplicables } from '../depistages';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().depistages;
const ids = (age: number, genre: string, risqueEleve?: Record<string, boolean>) =>
  depistagesApplicables({ age, genre, risqueEleve }, cfg).map((d) => `${d.type === 'risque-eleve' ? 'RE:' : ''}${d.id}`);

describe('Dépistages organisés (M11)', () => {
  it('femme 48 ans : col seulement, sein et colorectal masqués', () => {
    const d = depistagesApplicables({ age: 48, genre: 'F' }, cfg);
    expect(d.map((x) => x.libelle)).toEqual(['Dépistage du cancer du col de l’utérus']);
  });
  it.each(['H', 'F'])('%s 50 ans : colorectal affiché', (g) => expect(ids(50, g)).toContain('colorectal'));
  it('homme 48 ans : aucun', () => expect(ids(48, 'H')).toEqual([]));
  it('femme 50 ans : colorectal, sein et col', () => expect(ids(50, 'F')).toEqual(['colorectal', 'sein', 'col']));

  describe('bornes d’âge incluses', () => {
    it.each([
      [49, 'H', []], [50, 'H', ['colorectal']], [74, 'H', ['colorectal']], [75, 'H', []],
      [24, 'F', []], [25, 'F', ['col']], [65, 'F', ['colorectal', 'sein', 'col']], [66, 'F', ['colorectal', 'sein']],
    ])('%i ans %s : %j', (age, g, attendu) => expect(ids(age, g)).toEqual(attendu));
  });

  it('genre non renseigné : rien n’est masqué, dépistages sexués marqués "si concerné"', () => {
    const d = depistagesApplicables({ age: 50, genre: 'NSP' }, cfg);
    expect(d.map((x) => [x.id, x.siConcerne])).toEqual([['colorectal', false], ['sein', true], ['col', true]]);
  });

  it('risque élevé colorectal déclaré : coloscopie à la place du test, quel que soit l’âge', () => {
    expect(ids(46, 'H', { colorectal: true })).toEqual(['RE:colorectal']);
    const d = depistagesApplicables({ age: 55, genre: 'H', risqueEleve: { colorectal: true } }, cfg);
    expect(d).toEqual([expect.objectContaining({ type: 'risque-eleve', modalite: expect.stringMatching(/gastro-entérologue/) })]);
  });
  it('risque élevé sein déclaré chez un homme : ignoré', () => expect(ids(55, 'H', { sein: true })).toEqual(['colorectal']));
  it('risque élevé sein chez une femme de 47 ans : affiché', () => expect(ids(47, 'F', { sein: true })).toEqual(['col', 'RE:sein']));
});
