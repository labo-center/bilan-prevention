import { describe, expect, it } from 'vitest';
import { verifierFacturation } from '../facturation';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const cfg = scoresReels().facturation;

describe('Facturation (S2)', () => {
  it('RDP seul : valide, 30 €', () =>
    expect(verifierFacturation([], cfg)).toMatchObject({ valide: true, acteBilan: { code: 'RDP', montantEuros: 30 } }));
  it.each(['RVA', 'DOCCR'])('RDP + %s : valide', (c) => expect(verifierFacturation([c], cfg).valide).toBe(true));
  it('RVA et kit DOCCR ensemble : bloquant', () => {
    const r = verifierFacturation(['RVA', 'DOCCR'], cfg);
    expect(r.valide).toBe(false);
    expect(r.erreurs).toContain('1 seul acte complémentaire facturable par Bilan Prévention');
  });
  it('acte non autorisé pour le pharmacien : refusé', () =>
    expect(verifierFacturation(['JKHD001'], cfg).erreurs[0]).toMatch(/JKHD001/));
  it('même acte deux fois : dépassement', () => expect(verifierFacturation(['RVA', 'RVA'], cfg).valide).toBe(false));
});
