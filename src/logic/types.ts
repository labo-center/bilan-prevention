import type { Niveau, Seuil } from '../referentiels/schemaScores';

export type { Niveau };

/** Conclusion d'une règle : niveau de risque, message issu du référentiel, et marqueur "à vérifier". */
export interface Interpretation {
  niveau: Niveau;
  message: string;
  aVerifier: boolean;
}

/** Score incomplet : la règle ne conclut pas tant que des réponses manquent. */
export interface ScoreIncomplet {
  complet: false;
  manquants: string[];
}

/** Retourne le premier seuil dont la borne (incluse) couvre le score. */
export function interpreterScore(score: number, seuils: readonly Seuil[]): Interpretation {
  const s = seuils.find((x) => x.max === null || score <= x.max);
  if (!s) throw new RangeError(`Score ${score} hors de la grille du référentiel`);
  return { niveau: s.niveau, message: s.message, aVerifier: s.aVerifier ?? false };
}

/**
 * Somme des points d'items à choix. Les points saisis doivent appartenir aux options du référentiel :
 * toute autre valeur est une erreur de programmation et lève une exception (jamais de calcul silencieux).
 */
export function sommerPoints(
  items: ReadonlyArray<{ id: string; options: ReadonlyArray<{ points: number }> }>,
  reponses: Readonly<Record<string, number | undefined>>,
): { complet: true; score: number } | ScoreIncomplet {
  const manquants: string[] = [];
  let score = 0;
  for (const item of items) {
    const p = reponses[item.id];
    if (p === undefined) {
      manquants.push(item.id);
      continue;
    }
    if (!item.options.some((o) => o.points === p)) {
      throw new RangeError(`Valeur ${p} non prévue pour l'item ${item.id}`);
    }
    score += p;
  }
  return manquants.length > 0 ? { complet: false, manquants } : { complet: true, score };
}

/** Nombre de réponses "oui" (ou "vrai") parmi des items binaires. */
export function compterOui(
  items: ReadonlyArray<{ id: string }>,
  reponses: Readonly<Record<string, boolean | undefined>>,
): { complet: true; score: number } | ScoreIncomplet {
  const manquants = items.filter((i) => reponses[i.id] === undefined).map((i) => i.id);
  if (manquants.length > 0) return { complet: false, manquants };
  return { complet: true, score: items.filter((i) => reponses[i.id] === true).length };
}
