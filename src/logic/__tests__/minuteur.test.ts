import { describe, expect, it } from 'vitest';
import { etatMinuteur } from '../minuteur';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const reperes = scoresReels().dureeEntretien.reperesMinutes;
const min = (m: number, s = 0) => (m * 60 + s) * 1000;

describe('Minuteur d’entretien (S3)', () => {
  it('repères du livret : 30 et 45 min', () => expect(reperes).toEqual([30, 45]));
  it('début', () => expect(etatMinuteur(0, reperes)).toEqual({ affichage: '00:00', minutes: 0, repereAtteint: null, depasse: false }));
  it('29:59 : aucun repère', () => expect(etatMinuteur(min(29, 59), reperes)).toMatchObject({ affichage: '29:59', repereAtteint: null }));
  it('30:00 : repère 30 atteint', () => expect(etatMinuteur(min(30), reperes)).toMatchObject({ repereAtteint: 30, depasse: false }));
  it('44:59 : pas encore orange', () => expect(etatMinuteur(min(44, 59), reperes)).toMatchObject({ depasse: false }));
  it('45:00 : orange', () => expect(etatMinuteur(min(45), reperes)).toMatchObject({ repereAtteint: 45, depasse: true }));
  it('au-delà d’une heure', () => expect(etatMinuteur(min(61, 5), reperes).affichage).toBe('1:01:05'));
  it('durée négative (horloge reculée) : 00:00', () => expect(etatMinuteur(-5000, reperes).affichage).toBe('00:00'));
});
