import { describe, expect, it } from 'vitest';
import { chargerReferentiels } from '../loader';
import { lire4550, lireReferentielsReels } from './fixtures';

// Chaque cas part des référentiels réels et ne remplace que le fichier testé.
const avec = (obj: unknown, fichier = 'referentiels/45-50.json') => ({
  ...lireReferentielsReels(),
  [fichier]: JSON.stringify(obj),
});

describe('chargerReferentiels', () => {
  it('valide le référentiel 45-50 réel du dépôt', () => {
    const r = chargerReferentiels(lireReferentielsReels());
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.tranches.map((t) => t.tranche.id)).toEqual(['45-50']);
  });

  it('JSON syntaxiquement corrompu : refus avec le chemin du fichier', () => {
    const r = chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/45-50.json': '{ "version": "0.1.0", ' });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/45-50.json', champ: '(racine)' });
      expect(r.erreurs[0]!.message).toMatch(/JSON invalide/);
    }
  });

  it('champ manquant : refus avec le chemin du champ', () => {
    const ref = lire4550();
    delete (ref.tranche as Record<string, unknown>).ageMax;
    const r = chargerReferentiels(avec(ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs).toContainEqual(expect.objectContaining({ fichier: 'referentiels/45-50.json', champ: 'tranche.ageMax' }));
  });

  it('type incorrect dans un tableau : chemin avec indice', () => {
    const ref = lire4550();
    (ref.testsApplicables as { items: Array<Record<string, unknown>> }).items[2]!.libelle = 42;
    const r = chargerReferentiels(avec(ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.map((e) => e.champ)).toContain('testsApplicables.items[2].libelle');
  });

  it('champ inconnu à la racine : refus (schéma strict)', () => {
    const r = chargerReferentiels(avec({ ...lire4550(), seuilInvente: 3 }));
    expect(r.ok).toBe(false);
  });

  it('version non semver : refus', () => {
    const r = chargerReferentiels(avec({ ...lire4550(), version: 'v1' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.map((e) => e.champ)).toContain('version');
  });

  it('ageMin > ageMax : refus', () => {
    const ref = lire4550();
    Object.assign(ref.tranche as object, { ageMin: 50, ageMax: 45 });
    const r = chargerReferentiels(avec(ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.map((e) => e.champ)).toContain('tranche.ageMax');
  });

  it('identifiant de tranche différent du nom de fichier : refus', () => {
    const r = chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/60-65.json': JSON.stringify(lire4550()) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/60-65.json', champ: 'tranche.id' });
  });

  it('référence vers une source non déclarée : refus', () => {
    const ref = lire4550();
    (ref.tranche as { source: { ref: string } }).source.ref = 'inconnue';
    const r = chargerReferentiels(avec(ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.map((e) => e.champ)).toContain('tranche.source.ref');
  });

  it('source ne pointant pas vers docs/sources : refus', () => {
    const ref = lire4550();
    (ref.sources as Array<{ fichier: string }>)[0]!.fichier = 'https://exemple.org/livret.pdf';
    const r = chargerReferentiels(avec(ref));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs.map((e) => e.champ)).toContain('sources[0].fichier');
  });

  it('tranches qui se chevauchent : refus', () => {
    const a = lire4550();
    const b = lire4550();
    Object.assign(b.tranche as object, { id: '50-55', ageMin: 50, ageMax: 55 });
    const r = chargerReferentiels({ ...avec(a), 'referentiels/50-55.json': JSON.stringify(b) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/50-55.json', champ: 'tranche.ageMin' });
  });

  it('aucun référentiel de tranche : refus', () => {
    const { 'referentiels/45-50.json': _, ...sansTranche } = lireReferentielsReels();
    expect(chargerReferentiels(sansTranche).ok).toBe(false);
  });

  it('scores.json absent : refus', () => {
    const { 'referentiels/scores.json': _, ...sansScores } = lireReferentielsReels();
    const r = chargerReferentiels(sansScores);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/scores.json', message: 'fichier absent' });
  });

  it('scores.json corrompu : refus avec le chemin du fichier', () => {
    const r = chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/scores.json': '{ cassé' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/scores.json', champ: '(racine)' });
  });

  it('ignore les fichiers inconnus (orientation.json, incrément 4)', () => {
    expect(chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/orientation.json': '{ pas lu' }).ok).toBe(true);
  });
});
