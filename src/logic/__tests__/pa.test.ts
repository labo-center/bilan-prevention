import { describe, expect, it } from 'vitest';
import { evaluerPa, type MesurePa } from '../pa';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().pressionArterielle;
const deux = (sys: number, dia: number, bras: MesurePa['bras'] = 'gauche'): MesurePa[] => [
  { bras, systolique: sys, diastolique: dia },
  { bras, systolique: sys, diastolique: dia },
];

describe('Pression artérielle (M5)', () => {
  it('145/85 : orange, orienter vers le médecin traitant pour confirmation', () => {
    const r = evaluerPa(deux(145, 85), cfg);
    expect(r).toMatchObject({ complet: true, niveau: 'orange', bloquant: false });
    expect(r.complet && r.message).toMatch(/médecin traitant pour confirmation/);
  });
  it('182/100 : alerte rouge bloquante, orienter vers les urgences', () => {
    const r = evaluerPa(deux(182, 100), cfg);
    expect(r).toMatchObject({ complet: true, niveau: 'rouge', bloquant: true });
    expect(r.complet && r.message).toMatch(/urgences/);
  });

  describe('cas limites (seuil appliqué si systolique OU diastolique)', () => {
    it.each([
      [139, 85, 'aucun'],
      [140, 85, 'orange'],
      [130, 89, 'aucun'],
      [130, 90, 'orange'],
      [179, 100, 'orange'],
      [180, 100, 'rouge'],
      [160, 109, 'orange'],
      [160, 110, 'rouge'],
    ])('%i/%i : %s', (sys, dia, niveau) => {
      expect(evaluerPa(deux(sys, dia), cfg)).toMatchObject({ complet: true, niveau });
    });
  });

  it('sous les seuils : aucun message', () =>
    expect(evaluerPa(deux(120, 80), cfg)).toMatchObject({ niveau: 'aucun', message: null, bloquant: false }));
  it('moyenne exacte, sans arrondi : 139 et 140 → 139,5, sous le seuil', () => {
    const r = evaluerPa([{ bras: 'gauche', systolique: 139, diastolique: 80 }, { bras: 'gauche', systolique: 140, diastolique: 80 }], cfg);
    expect(r).toMatchObject({ niveau: 'aucun', retenue: { systolique: 139.5 } });
  });
  it('moyenne 138 et 142 = 140 : orange', () => {
    const r = evaluerPa([{ bras: 'droit', systolique: 138, diastolique: 80 }, { bras: 'droit', systolique: 142, diastolique: 80 }], cfg);
    expect(r).toMatchObject({ niveau: 'orange' });
  });
  it('une seule mesure : incomplet', () =>
    expect(evaluerPa([{ bras: 'gauche', systolique: 150, diastolique: 90 }], cfg)).toEqual({
      complet: false, raison: 'mesures-insuffisantes', nbMesures: 1, mesuresMin: 2,
    }));
  it('mesure invalide (systolique <= diastolique) : refusée', () =>
    expect(evaluerPa([{ bras: 'gauche', systolique: 80, diastolique: 120 }, { bras: 'gauche', systolique: 120, diastolique: 80 }], cfg))
      .toEqual({ complet: false, raison: 'mesure-invalide', index: 0 }));
  it('deux bras : le bras le plus haut est retenu', () => {
    const r = evaluerPa([...deux(130, 80, 'gauche'), ...deux(145, 85, 'droit')], cfg);
    expect(r).toMatchObject({ niveau: 'orange', retenue: { bras: 'droit', systolique: 145 } });
  });
  it('deux bras : la sévérité prime sur la systolique (diastolique ≥ 110 sur l’autre bras)', () => {
    const r = evaluerPa([...deux(170, 95, 'gauche'), ...deux(165, 112, 'droit')], cfg);
    expect(r).toMatchObject({ niveau: 'rouge', retenue: { bras: 'droit' } });
  });
});
