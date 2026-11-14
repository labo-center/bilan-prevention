import { describe, expect, it } from 'vitest';
import { calculerAge, parserDateIso } from '../age';

describe('parserDateIso', () => {
  it('accepte une date valide', () => {
    expect(parserDateIso('2026-11-13')).toEqual({ annee: 2026, mois: 11, jour: 13 });
  });
  it.each(['', '2026-13-01', '2026-02-30', '2025-02-29', '13/11/2026', '2026-11-00'])('refuse "%s"', (v) => {
    expect(parserDateIso(v)).toBeNull();
  });
  it('accepte le 29 février d\'une année bissextile', () => {
    expect(parserDateIso('2024-02-29')).not.toBeNull();
  });
});

describe('calculerAge (âge révolu à la date du rendez-vous)', () => {
  const rdv = '2026-11-13';
  it('47 ans', () => expect(calculerAge('1979-05-10', rdv)).toEqual({ ok: true, age: 47 }));
  it('veille de l\'anniversaire : année non encore comptée', () =>
    expect(calculerAge('1975-11-14', rdv)).toEqual({ ok: true, age: 50 }));
  it('jour de l\'anniversaire : année comptée', () => expect(calculerAge('1975-11-13', rdv)).toEqual({ ok: true, age: 51 }));
  it('né un 29 février, année non bissextile : anniversaire le 1er mars', () => {
    expect(calculerAge('1976-02-29', '2026-02-28')).toEqual({ ok: true, age: 49 });
    expect(calculerAge('1976-02-29', '2026-03-01')).toEqual({ ok: true, age: 50 });
  });
  it('naissance le jour du rendez-vous : 0 an', () => expect(calculerAge(rdv, rdv)).toEqual({ ok: true, age: 0 }));
  it('naissance après le rendez-vous : erreur', () =>
    expect(calculerAge('2027-01-01', rdv)).toEqual({ ok: false, erreur: 'naissance-apres-rdv' }));
  it('date de naissance vide : erreur', () =>
    expect(calculerAge('', rdv)).toEqual({ ok: false, erreur: 'date-naissance-invalide' }));
  it('date de rendez-vous invalide : erreur', () =>
    expect(calculerAge('1979-05-10', '2026-02-30')).toEqual({ ok: false, erreur: 'date-rdv-invalide' }));
});
