import { describe, expect, it } from 'vitest';
import { preRemplirFiche } from '../preremplissage';
import { basculerOption } from '../session';
import { tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

const regles = tranche4550Reelle().mapping.regles;

describe('Pré-remplissage de la fiche (M3)', () => {
  it('« Oui » à « Rôle d’aidant » : case cochée et marquée « déclaré par le patient »', () => {
    expect(preRemplirFiche({ Q4: 'oui' }, regles, {})['role-aidant']).toEqual({ valeur: true, origine: 'declare_patient' });
  });
  it('« Non » à Q4 : case non cochée', () => expect(preRemplirFiche({ Q4: 'non' }, regles, {})['role-aidant']).toBeUndefined());
  it('aucune réponse : fiche vide', () => expect(preRemplirFiche({}, regles, {})).toEqual({}));
  it('taille et poids déclarés copiés', () => {
    const f = preRemplirFiche({ Q11: 1.75, Q12: 80 }, regles, {});
    expect(f.taille).toEqual({ valeur: 1.75, origine: 'declare_patient' });
    expect(f.poids).toEqual({ valeur: 80, origine: 'declare_patient' });
  });
  it('Q7 : une maladie cochée → antécédents « oui » ; « Aucune » → « non »', () => {
    expect(preRemplirFiche({ Q7: ['cancers'] }, regles, {})['antecedents-medicaux']?.valeur).toBe('oui');
    expect(preRemplirFiche({ Q7: ['aucune'] }, regles, {})['antecedents-medicaux']?.valeur).toBe('non');
  });
  it('idées suicidaires déclarées (Q44) : case cochée', () =>
    expect(preRemplirFiche({ Q44: ['idees'] }, regles, {})['idees-suicidaires']?.valeur).toBe(true));
  it('correspondance par interprétation : marquée « à vérifier »', () =>
    expect(preRemplirFiche({ Q24: 'jamais' }, regles, {})['activite-insuffisante']).toMatchObject({ valeur: true, aVerifier: true }));
  it('saisie du professionnel conservée, même contraire à la déclaration', () => {
    const pro = { 'role-aidant': { valeur: false, origine: 'saisi_professionnel' as const } };
    expect(preRemplirFiche({ Q4: 'oui' }, regles, pro)['role-aidant']).toEqual(pro['role-aidant']);
  });
  it('réponse modifiée par le patient : déclaration précédente retirée', () => {
    const f1 = preRemplirFiche({ Q4: 'oui' }, regles, {});
    expect(preRemplirFiche({ Q4: 'non' }, regles, f1)['role-aidant']).toBeUndefined();
  });
});

describe('Options exclusives des questions à choix multiples', () => {
  const excl = ['aucune'];
  it('cocher « Aucune » retire les autres', () => expect(basculerOption(['cancers', 'mici'], 'aucune', true, excl)).toEqual(['aucune']));
  it('cocher une maladie retire « Aucune »', () => expect(basculerOption(['aucune'], 'cancers', true, excl)).toEqual(['cancers']));
  it('décocher', () => expect(basculerOption(['cancers', 'mici'], 'mici', false, excl)).toEqual(['cancers']));
});
