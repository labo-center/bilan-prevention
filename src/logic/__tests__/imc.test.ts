import { describe, expect, it } from 'vitest';
import { calculerImc } from '../imc';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().imc;

describe('IMC (M4)', () => {
  it('1,75 m et 80 kg : IMC 26,1', () => {
    const r = calculerImc({ tailleM: 1.75, poidsKg: 80 }, cfg);
    expect(r).toMatchObject({ calculable: true, imc: 26.1 });
  });
  it('taille vide : non calculable, sans erreur', () => {
    expect(calculerImc({ poidsKg: 80 }, cfg)).toEqual({ calculable: false, raison: 'taille-manquante' });
    expect(calculerImc({ poidsKg: 80, tailleM: null }, cfg)).toEqual({ calculable: false, raison: 'taille-manquante' });
  });
  it('poids vide : non calculable', () => expect(calculerImc({ tailleM: 1.7 }, cfg)).toMatchObject({ calculable: false }));
  it.each([0, -1, Number.NaN])('taille %s : valeur invalide', (t) =>
    expect(calculerImc({ tailleM: t, poidsKg: 70 }, cfg)).toEqual({ calculable: false, raison: 'valeur-invalide' }));
  it('les seuils IMC sont marqués "à vérifier" (absents des sources)', () => {
    const r = calculerImc({ tailleM: 1.75, poidsKg: 80 }, cfg);
    expect(r.calculable && r.interpretation.aVerifier).toBe(true);
  });
  it('cas limites sur la valeur arrondie : 24,9 / 25,0', () => {
    // 1 m : l'IMC est égal au poids
    const a = calculerImc({ tailleM: 1, poidsKg: 24.9 }, cfg);
    const b = calculerImc({ tailleM: 1, poidsKg: 25 }, cfg);
    expect(a.calculable && a.interpretation.message).toBe('Corpulence normale');
    expect(b.calculable && b.interpretation.message).toBe('Surpoids');
  });
  it('arrondi au dixième : 24,94 → 24,9 ; 24,95 → 25,0', () => {
    expect(calculerImc({ tailleM: 1, poidsKg: 24.94 }, cfg)).toMatchObject({ imc: 24.9 });
    expect(calculerImc({ tailleM: 1, poidsKg: 24.95 }, cfg)).toMatchObject({ imc: 25 });
  });
  it('demi-dixième exact arrondi vers le haut malgré le calcul en virgule flottante : 35,2 kg / 1,60 m = 13,75 → 13,8', () => {
    expect(calculerImc({ tailleM: 1.6, poidsKg: 35.2 }, cfg)).toMatchObject({ imc: 13.8 });
    expect(calculerImc({ tailleM: 1.6, poidsKg: 80 }, cfg)).toMatchObject({ imc: 31.3 });
  });
  it('dernier seuil sans borne haute', () => {
    const r = calculerImc({ tailleM: 1, poidsKg: 300 }, cfg);
    expect(r.calculable && r.interpretation.message).toBe('Obésité');
  });
});
