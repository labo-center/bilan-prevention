import type { RegleMapping } from '../referentiels/schemaSaisie';

export type ReponseAQ = string | string[] | number;
export type ReponsesAQ = Readonly<Record<string, ReponseAQ | undefined>>;

export type ValeurChamp = boolean | string | number;
export type Origine = 'declare_patient' | 'saisi_professionnel';

export interface EntreeFiche {
  valeur?: ValeurChamp;
  precision?: string;
  origine: Origine;
  /** Correspondance autoquestionnaire → fiche à valider par le pharmacien référent. */
  aVerifier?: boolean;
}

export type Fiche = Readonly<Record<string, EntreeFiche>>;

function correspond(reponse: ReponseAQ | undefined, attendues: readonly string[]): boolean {
  if (reponse === undefined) return false;
  if (Array.isArray(reponse)) return reponse.some((r) => attendues.includes(r));
  return typeof reponse === 'string' && attendues.includes(reponse);
}

/**
 * Pré-remplit la fiche de repérage à partir de l'autoquestionnaire (M3).
 * Les champs saisis par le professionnel sont conservés tels quels ; tous les autres sont
 * recalculés à partir des réponses, avec l'origine « déclaré par le patient ».
 */
export function preRemplirFiche(reponses: ReponsesAQ, regles: readonly RegleMapping[], fiche: Fiche): Fiche {
  const res: Record<string, EntreeFiche> = {};
  for (const [id, e] of Object.entries(fiche)) if (e.origine === 'saisi_professionnel') res[id] = e;

  for (const r of regles) {
    if (res[r.champ]?.origine === 'saisi_professionnel') continue;
    const reponse = reponses[r.question];
    if ('copier' in r) {
      if (typeof reponse === 'number' && Number.isFinite(reponse)) res[r.champ] = { valeur: reponse, origine: 'declare_patient' };
      continue;
    }
    if (correspond(reponse, r.siReponse)) {
      res[r.champ] = { valeur: r.valeur, origine: 'declare_patient', ...(r.aVerifier ? { aVerifier: true } : {}) };
    }
  }
  return res;
}
