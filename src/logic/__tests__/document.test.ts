import { describe, expect, it } from 'vitest';
import { nombreFr, piedDePage } from '../document';
import { creerSession } from '../session';
import { verifierFacturation } from '../facturation';
import { modele, sessionComplete } from './fixturesSession';
import { orientationReelle, scoresReels, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

const tranche = tranche4550Reelle();
const scores = scoresReels();
const orientation = orientationReelle();

describe('Contenu du PDF (M14)', () => {
  it('pied de page : version des référentiels et date', () => {
    const p = piedDePage(tranche, scores, orientation, '2026-11-14');
    expect(p).toBe(`Référentiel MBP 45-50 v${tranche.version}, scores v${scores.version}, orientation v${orientation.version} - non validé par le pharmacien référent - édité le 14/11/2026`);
  });
  it('pied de page : date de validation la plus récente quand tout est validé', () => {
    const p = piedDePage({ ...tranche, dateValidation: '2026-12-01' }, { ...scores, dateValidation: '2026-12-03' }, { ...orientation, dateValidation: '2026-12-02' }, '2026-12-05');
    expect(p).toContain('validé le 03/12/2026');
  });
  it('fiche : champs renseignés, origine déclarée signalée', () => {
    const m = modele(sessionComplete());
    const lignes = m.sectionsFiche.flatMap((s) => s.lignes);
    expect(lignes).toContainEqual({ libelle: 'Rôle d’aidant', valeur: 'Oui', declare: true, aVerifier: false });
    expect(lignes).toContainEqual(expect.objectContaining({ libelle: 'Nom et prénom', valeur: 'DUPONT Marie', declare: false }));
    expect(lignes).toContainEqual(expect.objectContaining({ libelle: 'Pression artérielle', valeur: '145/85 mmHg' }));
    expect(lignes).toContainEqual(expect.objectContaining({ libelle: 'Taille', valeur: '1,75 m', declare: true }));
  });
  it('résultats : IMC, PA avec orientation, dépistage', () => {
    const r = modele(sessionComplete()).resultatsTests.lignes.map((l) => l.valeur);
    expect(r).toContain('IMC 26,1 - Surpoids');
    expect(r).toContain('145/85 mmHg - Si PA ≥ 140/90 mmHg, orienter vers le médecin traitant pour confirmation');
    expect(r.some((v) => v.includes('25 à 65 ans'))).toBe(true);
  });
  it('PPP : ressources du kit, modalités de suivi, case d’opposition non cochée', () => {
    const { ppp } = modele(sessionComplete());
    expect(ppp.lignes[0]).toMatchObject({ priorite: 'Tabac, alcool et autres addictions' });
    expect(ppp.lignes[0]!.ressources).toContain('3989');
    expect(ppp.modalitesSuivi).toBe('Point dans 1 mois');
    expect(ppp.opposition.coche).toBe(false);
    expect(ppp.mentionOpposition).toBeNull();
  });
  it('opposition cochée : mention « Le patient s’oppose à la transmission au médecin traitant »', () => {
    const { ppp } = modele(sessionComplete({ type: 'opposition', oppose: true }));
    expect(ppp.opposition.coche).toBe(true);
    expect(ppp.mentionOpposition).toBe('Le patient s’oppose à la transmission au médecin traitant.');
  });
  it('calculs obligatoires présents : pas de mention INCOMPLET', () => expect(modele(sessionComplete()).incomplet).toEqual([]));
  it('PA et IMC manquants : INCOMPLET avec les tests concernés', () => {
    const s = creerSession({ dateRdv: '2026-11-13', dateNaissance: '1978-03-02', genre: 'F', age: 48, trancheId: '45-50' });
    expect(modele(s).incomplet).toEqual(['Repérer le surpoids, l’obésité, la dénutrition (pesée, taille, IMC)', 'Mesure de la pression artérielle']);
  });
  it('nom du fichier sans donnée identifiante', () => {
    const m = modele(sessionComplete());
    expect(m.nomFichier).toBe('bilan-prevention-45-50-2026-11-13.pdf');
    expect(m.nomFichier).not.toMatch(/DUPONT|1978/);
  });
  it('facturation : RVA + DOCCR bloquant (S2)', () =>
    expect(verifierFacturation(sessionComplete({ type: 'acte', code: 'RVA', coche: true }, { type: 'acte', code: 'DOCCR', coche: true }).actesComplementaires, scores.facturation).valide).toBe(false));
});

describe('Format des nombres du PDF', () => {
  it.each([[1.75, '1,75'], [80, '80'], [139.5, '139,5'], [26.1, '26,1'], [1.755, '1,76']])('%s → %s', (n, attendu) => expect(nombreFr(n)).toBe(attendu));
});
