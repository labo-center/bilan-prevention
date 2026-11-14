import type { ReferentielOrientation } from '../referentiels/schemaOrientation';
import type { ReferentielScores } from '../referentiels/schemaScores';
import type { ReferentielTranche } from '../referentiels/schemas';
import type { EvaluationSession } from './evaluation';
import { construirePpp } from './ppp';
import type { Session } from './session';

/** Une ligne « libellé : valeur » de la fiche imprimée. */
export interface LigneDocument {
  libelle: string;
  valeur: string;
  declare: boolean;
  aVerifier: boolean;
}

export interface SectionDocument {
  titre: string;
  lignes: LigneDocument[];
}

/** Contenu du PDF (M14), indépendant de la bibliothèque de rendu : testable sans navigateur. */
export interface ModeleDocument {
  titreFiche: string;
  /** Tests obligatoires sans résultat : non vide → mention « INCOMPLET ». */
  incomplet: string[];
  sectionsFiche: SectionDocument[];
  resultatsTests: SectionDocument;
  priorites: string[];
  ppp: {
    titre: string;
    sousTitre: string;
    colonnes: [string, string, string, string];
    lignes: Array<{ priorite: string; motif: string | null; freins: string; conseils: string; ressources: string }>;
    titreModalites: string;
    modalitesSuivi: string;
    encouragement: string;
    opposition: { libelle: string; coche: boolean };
    mentionOpposition: string | null;
    notes: string[];
  };
  piedDePage: string;
  nomFichier: string;
}

const dateFr = (iso: string) => iso.split('-').reverse().join('/');
/** Nombre au format français, jusqu'à 2 décimales sans zéro inutile (1,75 m ; 139,5 mmHg ; 80 kg). */
export const nombreFr = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

/** Pied de page : version des trois référentiels, état de validation et date d'édition. */
export function piedDePage(tranche: ReferentielTranche, scores: ReferentielScores, orientation: ReferentielOrientation, dateEdition: string): string {
  const refs = [tranche, scores, orientation];
  const valides = refs.every((r) => r.dateValidation !== null);
  const validation = valides
    ? `validé le ${dateFr(refs.map((r) => r.dateValidation!).sort().at(-1)!)}`
    : 'non validé par le pharmacien référent';
  return `Référentiel MBP ${tranche.tranche.id} v${tranche.version}, scores v${scores.version}, orientation v${orientation.version} - ${validation} - édité le ${dateFr(dateEdition)}`;
}

/** Construit le contenu du PDF : fiche de repérage complétée puis PPP. Fonction pure. */
export function construireDocument(
  session: Session,
  ev: EvaluationSession,
  tranche: ReferentielTranche,
  scores: ReferentielScores,
  orientation: ReferentielOrientation,
  dateEdition: string,
): ModeleDocument {
  const genres = new Map(tranche.ouvertureSession.genres.map((g) => [g.id, g.libelle]));
  const libThem = new Map(scores.thematiques.items.map((t) => [t.id, t.libelle]));
  const score = (r: { complet: boolean } & ({ score: number; interpretation: { message: string } } | object)) =>
    'score' in r ? `${r.score} - ${r.interpretation.message}` : null;

  const calcule: Record<string, string | null> = {
    'session.dateRdv': dateFr(session.ouverture.dateRdv),
    'session.age': `${session.ouverture.age} ans`,
    'session.genre': genres.get(session.ouverture.genre) ?? session.ouverture.genre,
    'tests.pa': ev.pa.complet ? `${nombreFr(ev.pa.retenue.systolique)}/${nombreFr(ev.pa.retenue.diastolique)} mmHg` : null,
    'tests.had': ev.had.some((d) => d.complet)
      ? ev.had.map((d) => (d.complet ? `${d.dimension} = ${d.score} (${d.interpretation.message})` : `${d.dimension} non calculé`)).join(' ; ')
      : null,
    'tests.face': score(ev.face),
    'tests.fagerstrom': score(ev.fagerstrom),
    'tests.cast': score(ev.cast),
  };

  const sectionsFiche: SectionDocument[] = tranche.ficheReperage.sections
    .map((s) => ({
      titre: s.titre,
      lignes: s.champs.flatMap((c): LigneDocument[] => {
        if (c.type === 'calcule') {
          const v = calcule[c.lien];
          return v ? [{ libelle: c.libelle, valeur: v, declare: false, aVerifier: false }] : [];
        }
        const e = session.fiche[c.id];
        if (!e || e.valeur === undefined || e.valeur === '' || e.valeur === false) return [];
        let valeur: string;
        if (c.type === 'case') valeur = 'Oui';
        else if (c.type === 'ouiNon') valeur = e.valeur === 'oui' ? 'Oui' : 'Non';
        else if (c.type === 'choix') valeur = c.options.find((o) => o.id === e.valeur)?.libelle ?? String(e.valeur);
        else if (c.type === 'nombre') valeur = `${nombreFr(Number(e.valeur))}${c.unite ? ` ${c.unite}` : ''}`;
        else valeur = String(e.valeur);
        if (e.precision) valeur += ` (${e.precision})`;
        return [{ libelle: c.libelle, valeur, declare: e.origine === 'declare_patient', aVerifier: e.aVerifier ?? false }];
      }),
    }))
    .filter((s) => s.lignes.length > 0);

  const ligne = (libelle: string, valeur: string, aVerifier = false): LigneDocument => ({ libelle, valeur, declare: false, aVerifier });
  const resultats: LigneDocument[] = [];
  const titres = new Map(tranche.testsApplicables.items.map((t) => [t.id, t.libelle]));
  const manquants: string[] = [];
  for (const t of tranche.testsApplicables.items) {
    let v: string | null;
    let aVerifier = false;
    if (t.id === 'imc') {
      v = ev.imc.calculable ? `IMC ${nombreFr(ev.imc.imc)} - ${ev.imc.interpretation.message}` : null;
      aVerifier = ev.imc.calculable && ev.imc.interpretation.aVerifier;
    } else if (t.id === 'pression-arterielle') {
      v = ev.pa.complet ? `${nombreFr(ev.pa.retenue.systolique)}/${nombreFr(ev.pa.retenue.diastolique)} mmHg${ev.pa.message ? ` - ${ev.pa.message}` : ''}` : null;
    } else if (t.id === 'face' || t.id === 'fagerstrom' || t.id === 'cast') {
      v = score(ev[t.id]);
    } else if (t.id === 'had') {
      v = calcule['tests.had'] ?? null;
    } else {
      v = session.tests.textes[t.id]?.trim() || null;
    }
    if (v) resultats.push(ligne(t.libelle, v, aVerifier));
    else if (tranche.export.calculsObligatoires.includes(t.id)) manquants.push(titres.get(t.id) ?? t.id);
  }
  for (const d of ev.depistages) resultats.push(ligne(d.libelle, d.modalite));

  const lignesPpp = construirePpp(session, ev, tranche, scores, orientation);
  const col = (id: string) => orientation.ppp.colonnes.find((c) => c.id === id)!.libelle;

  return {
    titreFiche: tranche.sources.find((x) => x.id === tranche.ficheReperage.source.ref)?.document ?? 'Fiche d’aide au repérage des risques',
    incomplet: manquants,
    sectionsFiche,
    resultatsTests: { titre: 'Résultats des tests et dépistages', lignes: resultats },
    priorites: session.decision.priorites.map((p) => libThem.get(p) ?? p),
    ppp: {
      titre: orientation.ppp.titre,
      sousTitre: orientation.ppp.sousTitre,
      colonnes: [col('priorite'), col('freins'), col('conseils'), col('ressources')],
      lignes: lignesPpp.map((l) => ({ priorite: l.libelle, motif: l.motif, freins: l.freins, conseils: l.conseils, ressources: l.ressources })),
      titreModalites: orientation.ppp.modalitesSuivi,
      modalitesSuivi: session.ppp.modalitesSuivi,
      encouragement: orientation.ppp.encouragement,
      opposition: { libelle: orientation.ppp.opposition, coche: session.ppp.opposition },
      mentionOpposition: session.ppp.opposition ? orientation.ppp.mentionOpposition : null,
      notes: orientation.ppp.colonnes.filter((c) => c.note).map((c) => c.note!),
    },
    piedDePage: piedDePage(tranche, scores, orientation, dateEdition),
    // Aucune donnée identifiante dans le nom du fichier.
    nomFichier: `bilan-prevention-${tranche.tranche.id}-${session.ouverture.dateRdv}.pdf`,
  };
}
