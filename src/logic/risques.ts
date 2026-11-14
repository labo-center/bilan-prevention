import type { Niveau } from './types';

/** Risque repéré, issu d'une règle de scores.json ou d'un champ de la fiche (PRD §6.2 étape 4). */
export interface Risque {
  /** Identifiant stable : deux sources du même risque partagent l'id (dédoublonnage). */
  id: string;
  theme: string;
  niveau: Exclude<Niveau, 'aucun'>;
  /** Document et page d'origine, ou « Fiche de repérage ». */
  source: string;
  message: string;
  aVerifier: boolean;
  /** Une alerte bloquante doit être acquittée pour continuer (PA ≥ 180/110). */
  bloquant: boolean;
}

const RANG: Record<Risque['niveau'], number> = { rouge: 0, orange: 1, info: 2 };

/** Tri rouge > orange > info ; ordre d'apparition conservé à niveau égal (tri stable). */
export function trierRisques(risques: readonly Risque[]): Risque[] {
  return [...risques].sort((a, b) => RANG[a.niveau] - RANG[b.niveau]);
}

/** Garde un seul risque par id : le plus sévère, puis le premier rencontré. */
export function dedoublonner(risques: readonly Risque[]): Risque[] {
  const parId = new Map<string, Risque>();
  for (const r of risques) {
    const existant = parId.get(r.id);
    if (!existant || RANG[r.niveau] < RANG[existant.niveau]) parId.set(r.id, r);
  }
  return [...parId.values()];
}
