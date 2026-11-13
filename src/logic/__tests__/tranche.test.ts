import { describe, expect, it } from 'vitest';
import { selectionnerTranche } from '../tranche';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels } from '../../referentiels/__tests__/fixtures';

// Bornes lues dans le référentiel réel : le test vérifie la règle, pas une valeur codée en dur.
const chargement = chargerReferentiels(lireReferentielsReels());
if (!chargement.ok) throw new Error('référentiels invalides');
const tranches = chargement.tranches.map((t) => t.tranche);
const t4550 = tranches.find((t) => t.id === '45-50')!;

describe('selectionnerTranche (bornes incluses, livret p. 3)', () => {
  it('47 ans : tranche 45-50 (critère M1)', () => expect(selectionnerTranche(47, tranches)?.id).toBe('45-50'));
  it('borne basse incluse', () => expect(selectionnerTranche(t4550.ageMin, tranches)?.id).toBe('45-50'));
  it('borne haute incluse', () => expect(selectionnerTranche(t4550.ageMax, tranches)?.id).toBe('45-50'));
  it('juste sous la borne basse : hors tranche', () => expect(selectionnerTranche(t4550.ageMin - 1, tranches)).toBeNull());
  it('51 ans : hors tranche (critère M1)', () => expect(selectionnerTranche(51, tranches)).toBeNull());
  it('aucune tranche chargée : hors tranche', () => expect(selectionnerTranche(47, [])).toBeNull());
});
