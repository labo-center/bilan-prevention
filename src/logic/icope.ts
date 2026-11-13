import type { ReferentielScores } from '../referentiels/schemaScores';
import type { Interpretation } from './types';

/** Saisie de l'étape 1 ICOPE (livret p. 31). true = réponse correcte / capacité conservée. */
export interface SaisieIcope {
  cognition?: { motsRappeles?: boolean[]; orientationCorrecte?: boolean[] };
  nutrition?: { perte3kgEn3Mois?: boolean; perteAppetit?: boolean };
  vision?: { problemeYeux?: boolean };
  audition?: { oreilleDroiteOk?: boolean; oreilleGaucheOk?: boolean };
  psychologie?: { deprime?: boolean; perteInteret?: boolean };
  mobilite?: { cinqLeversRealises?: boolean; tempsSecondes?: number };
}

export type StatutDomaine = 'positif' | 'negatif' | 'non-evalue';
export type IdDomaine = ReferentielScores['icope']['domaines'][number]['id'];

export interface ResultatDomaineIcope {
  id: IdDomaine;
  libelle: string;
  statut: StatutDomaine;
  critere: string;
  aVerifier: boolean;
}

export interface ResultatIcope {
  domaines: ResultatDomaineIcope[];
  /** Conclusion globale si au moins un domaine est positif. */
  conclusion: Interpretation | null;
}

/**
 * Statut à partir de réponses "signal d'alerte" : positif dès qu'une réponse alerte,
 * négatif si toutes les réponses attendues sont présentes et aucune n'alerte, sinon non évalué.
 */
function statut(alertes: ReadonlyArray<boolean | undefined>, nbAttendu: number): StatutDomaine {
  if (alertes.some((a) => a === true)) return 'positif';
  const renseignees = alertes.filter((a) => a !== undefined).length;
  return renseignees === nbAttendu ? 'negatif' : 'non-evalue';
}

const inverse = (v: boolean | undefined) => (v === undefined ? undefined : !v);

export function evaluerIcope(saisie: SaisieIcope, cfg: ReferentielScores['icope']): ResultatIcope {
  const nbMots = cfg.motsARetenir.length;
  const nbOrientation = cfg.questionsOrientation.length;
  const c = saisie.cognition ?? {};
  const mots = c.motsRappeles ?? [];
  const orient = c.orientationCorrecte ?? [];
  const m = saisie.mobilite ?? {};

  let mobilite: StatutDomaine;
  if (m.cinqLeversRealises === false) mobilite = 'positif';
  else if (m.cinqLeversRealises === true && m.tempsSecondes !== undefined && Number.isFinite(m.tempsSecondes)) {
    // Normal si 5 levers en moins de N secondes : N secondes ou plus est positif.
    mobilite = m.tempsSecondes >= cfg.mobiliteSecondesMax ? 'positif' : 'negatif';
  } else mobilite = 'non-evalue';

  const statuts: Record<IdDomaine, StatutDomaine> = {
    cognition: statut(
      [...mots.slice(0, nbMots).map(inverse), ...orient.slice(0, nbOrientation).map(inverse)],
      nbMots + nbOrientation,
    ),
    nutrition: statut([saisie.nutrition?.perte3kgEn3Mois, saisie.nutrition?.perteAppetit], 2),
    vision: statut([saisie.vision?.problemeYeux], 1),
    audition: statut([inverse(saisie.audition?.oreilleDroiteOk), inverse(saisie.audition?.oreilleGaucheOk)], 2),
    psychologie: statut([saisie.psychologie?.deprime, saisie.psychologie?.perteInteret], 2),
    mobilite,
  };

  const domaines = cfg.domaines.map((d) => ({
    id: d.id,
    libelle: d.libelle,
    statut: statuts[d.id],
    critere: d.critere,
    aVerifier: d.aVerifier,
  }));
  const positif = domaines.some((d) => d.statut === 'positif');
  return {
    domaines,
    conclusion: positif
      ? { niveau: cfg.siPositif.niveau, message: cfg.siPositif.message, aVerifier: cfg.siPositif.aVerifier ?? false }
      : null,
  };
}
