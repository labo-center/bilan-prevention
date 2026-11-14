/** Bornes d'une tranche d'âge telles que lues dans le référentiel (bornes incluses). */
export interface BornesTranche {
  id: string;
  ageMin: number;
  ageMax: number;
}

/**
 * Retourne la tranche dont les bornes (incluses) contiennent l'âge, ou null si hors tranche.
 * Les bornes viennent exclusivement des référentiels : aucune valeur d'âge en dur ici.
 */
export function selectionnerTranche<T extends BornesTranche>(age: number, tranches: readonly T[]): T | null {
  return tranches.find((t) => age >= t.ageMin && age <= t.ageMax) ?? null;
}
