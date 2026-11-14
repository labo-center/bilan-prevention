import { describe, expect, it } from 'vitest';
import { chargerReferentiels } from '../loader';
import { lire4550, lireOrientation, lireReferentielsReels } from './fixtures';

// Chaque cas part des référentiels réels et ne remplace que le fichier testé.
const avec = (obj: unknown, fichier = 'referentiels/45-50.json') => ({
  ...lireReferentielsReels(),
  [fichier]: JSON.stringify(obj),
});

/** Tranches présentes dans referentiels/ (incrément 6 : les 4 tranches du dispositif). */
const TRANCHES_ATTENDUES = Object.keys(lireReferentielsReels())
  .flatMap((f) => /(\d{2}-\d{2})\.json$/.exec(f)?.[1] ?? [])
  .sort();

describe('chargerReferentiels', () => {
  it('valide les référentiels réels du dépôt', () => {
    const r = chargerReferentiels(lireReferentielsReels());
    expect(r.ok ? [] : r.erreurs).toEqual([]);
    if (r.ok) expect(r.tranches.map((t) => t.tranche.id)).toEqual(TRANCHES_ATTENDUES);
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
    const sansTranche = Object.fromEntries(Object.entries(lireReferentielsReels()).filter(([f]) => !/\d{2}-\d{2}\.json$/.test(f)));
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

  it('ignore les fichiers inconnus', () => {
    expect(chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/autre.json': '{ pas lu' }).ok).toBe(true);
  });

  it('orientation.json absent : refus', () => {
    const { 'referentiels/orientation.json': _, ...sans } = lireReferentielsReels();
    const r = chargerReferentiels(sans);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.erreurs[0]).toMatchObject({ fichier: 'referentiels/orientation.json', message: 'fichier absent' });
  });
});

describe('Cohérence autoquestionnaire / fiche / correspondance', () => {
  const champs = (modifier: (r: Record<string, any>) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const ref = lire4550() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    modifier(ref);
    const r = chargerReferentiels(avec(ref));
    return r.ok ? [] : r.erreurs.map((e) => e.champ);
  };
  it('le référentiel réel est cohérent', () => expect(champs(() => {})).toEqual([]));
  it('correspondance vers un champ inexistant : refus', () =>
    expect(champs((r) => { r.mapping.regles[0].champ = 'inconnu'; })).toContain('mapping.regles[0].champ'));
  it('correspondance vers une réponse inexistante : refus', () =>
    expect(champs((r) => { r.mapping.regles[0].siReponse = ['peut-etre']; })).toContain('mapping.regles[0].siReponse'));
  it('valeur incompatible avec le type du champ : refus', () =>
    expect(champs((r) => { r.mapping.regles[0].valeur = 'oui'; })).toContain('mapping.regles[0].valeur'));
  it('liaison vers un champ du mauvais type : refus', () =>
    expect(champs((r) => { r.liaisons.taille = 'role-aidant'; })).toContain('liaisons.taille'));
  it('question en double : refus', () =>
    expect(champs((r) => { r.autoquestionnaire.sections[0].questions[1].id = 'Q1'; })).toContain('autoquestionnaire.sections[0].questions[1].id'));
  it('thématique inconnue de scores.json : refus', () =>
    expect(champs((r) => { r.ficheReperage.sections[1].thematique = 'inventee'; })).toContain('ficheReperage.sections[1].thematique'));
  it('question liée aux repères alcool sans les options de scores.json : refus', () =>
    expect(champs((r) => { r.liaisons.questionReperesAlcool = 'Q32'; })).toContain('liaisons.questionReperesAlcool'));
});

describe('Validation de orientation.json', () => {
  const erreurs = (modifier: (o: Record<string, any>) => void) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    const o = lireOrientation() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    modifier(o);
    const r = chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/orientation.json': JSON.stringify(o) });
    return r.ok ? [] : r.erreurs.map((e) => `${e.fichier}:${e.champ}`);
  };
  it('le fichier réel est valide', () => expect(erreurs(() => {})).toEqual([]));
  it('thématique inconnue de scores.json : refus', () =>
    expect(erreurs((o) => { o.kit.thematiques[0].thematique = 'inventee'; })).toContain('referentiels/orientation.json:kit.thematiques[0].thematique'));
  it('thématique en double dans le kit : refus', () =>
    expect(erreurs((o) => { o.kit.thematiques[1].thematique = o.kit.thematiques[0].thematique; })).toContain('referentiels/orientation.json:kit.thematiques[1].thematique'));
  it('balance à 3 cases : refus', () =>
    expect(erreurs((o) => { o.entretienMotivationnel.balance.cases.pop(); })).toContain('referentiels/orientation.json:entretienMotivationnel.balance.cases'));
  it('stade recommandé inconnu : refus', () =>
    expect(erreurs((o) => { o.entretienMotivationnel.balance.stadesRecommandes = ['inconnu']; })).toContain('referentiels/orientation.json:entretienMotivationnel.balance.stadesRecommandes[0]'));
  it('pharmacien sans ressource pour une thématique : refus', () =>
    expect(erreurs((o) => { o.kit.thematiques[0].ressources.pharmacien = []; })).toContain('referentiels/orientation.json:kit.thematiques[0].ressources.pharmacien'));
  it('ajout d’office sur une règle non câblée : refus', () =>
    expect(erreurs((o) => { o.ajoutsDOffice[0].regle = 'imc'; })).toContain('referentiels/orientation.json:ajoutsDOffice[0].regle'));
  it('Q46 : option inexistante dans les souhaits du patient : refus', () => {
    const t = lire4550() as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    t.souhaitsPatient.correspondances[0].option = 'inexistante';
    const r = chargerReferentiels(avec(t));
    expect(r.ok ? [] : r.erreurs.map((e) => e.champ)).toContain('souhaitsPatient.correspondances[0].option');
  });
});
