import { describe, expect, it } from 'vitest';
import { evaluerIcope, type SaisieIcope } from '../icope';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().icope;
const normal: SaisieIcope = {
  cognition: { motsRappeles: [true, true, true], orientationCorrecte: [true, true, true, true] },
  nutrition: { perte3kgEn3Mois: false, perteAppetit: false },
  vision: { problemeYeux: false },
  audition: { oreilleDroiteOk: true, oreilleGaucheOk: true },
  psychologie: { deprime: false, perteInteret: false },
  mobilite: { cinqLeversRealises: true, tempsSecondes: 10 },
};
const statut = (s: SaisieIcope, id: string) => evaluerIcope(s, cfg).domaines.find((d) => d.id === id)!.statut;

describe('ICOPE étape 1', () => {
  it('tout normal : 6 domaines négatifs, aucune conclusion', () => {
    const r = evaluerIcope(normal, cfg);
    expect(r.domaines.map((d) => d.statut)).toEqual(Array(6).fill('negatif'));
    expect(r.conclusion).toBeNull();
  });
  it('rien saisi : 6 domaines non évalués', () =>
    expect(evaluerIcope({}, cfg).domaines.every((d) => d.statut === 'non-evalue')).toBe(true));

  describe('mobilité, cas limites (normal si moins de 14 s)', () => {
    it('13,9 s : négatif', () => expect(statut({ mobilite: { cinqLeversRealises: true, tempsSecondes: 13.9 } }, 'mobilite')).toBe('negatif'));
    it('14 s : positif', () => expect(statut({ mobilite: { cinqLeversRealises: true, tempsSecondes: 14 } }, 'mobilite')).toBe('positif'));
    it('levers non réalisés : positif', () => expect(statut({ mobilite: { cinqLeversRealises: false } }, 'mobilite')).toBe('positif'));
    it('temps absent : non évalué', () => expect(statut({ mobilite: { cinqLeversRealises: true } }, 'mobilite')).toBe('non-evalue'));
    it('critère de mobilité sourcé (pas "à vérifier")', () =>
      expect(evaluerIcope(normal, cfg).domaines.find((d) => d.id === 'mobilite')!.aVerifier).toBe(false));
  });

  it.each([
    ['cognition', { cognition: { motsRappeles: [true, false, true], orientationCorrecte: [true, true, true, true] } }],
    ['cognition', { cognition: { orientationCorrecte: [true, true, false] } }],
    ['nutrition', { nutrition: { perte3kgEn3Mois: true } }],
    ['nutrition', { nutrition: { perteAppetit: true } }],
    ['vision', { vision: { problemeYeux: true } }],
    ['audition', { audition: { oreilleDroiteOk: true, oreilleGaucheOk: false } }],
    ['psychologie', { psychologie: { deprime: false, perteInteret: true } }],
  ] as const)('%s positif', (id, saisie) => expect(statut(saisie as SaisieIcope, id)).toBe('positif'));

  it('cognition partiellement saisie sans erreur : non évalué', () =>
    expect(statut({ cognition: { motsRappeles: [true, true, true] } }, 'cognition')).toBe('non-evalue'));

  it('un domaine positif : conclusion "à vérifier" vers le médecin traitant', () => {
    const r = evaluerIcope({ ...normal, vision: { problemeYeux: true } }, cfg);
    expect(r.conclusion).toMatchObject({ niveau: 'orange', aVerifier: true, message: expect.stringMatching(/médecin traitant/) });
    expect(r.domaines.find((d) => d.id === 'vision')!.aVerifier).toBe(true);
  });
});
