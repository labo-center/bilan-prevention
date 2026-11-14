import type { ReferentielScores } from '../referentiels/schemaScores';

export type EchelleHumeur = 'adrs' | 'had';

/**
 * Échelles anxio-dépressives applicables selon l'âge (livret p. 34) : ADRS de 18 à 20 ans,
 * HAD à partir de 20 ans. À 20 ans les deux sont proposées, le professionnel choisit.
 */
export function echellesHumeurApplicables(age: number, cfg: Pick<ReferentielScores, 'adrs' | 'had'>): EchelleHumeur[] {
  const dans = (a: { ageMin: number; ageMax?: number | undefined }) => age >= a.ageMin && (a.ageMax === undefined || age <= a.ageMax);
  const res: EchelleHumeur[] = [];
  if (dans(cfg.adrs.applicabilite)) res.push('adrs');
  if (dans(cfg.had.applicabilite)) res.push('had');
  return res;
}

/** Grille d'Amsler proposée selon l'âge (livret p. 11 : « si > 60 ans »). */
export function amslerApplicable(age: number, cfg: Pick<ReferentielScores, 'amsler'>): boolean {
  return age >= cfg.amsler.applicabilite.ageMin;
}

/**
 * Le test est-il à proposer à cette personne ? Les tests de la tranche (livret p. 11) sont filtrés
 * par l'âge pour l'ADRS, la HAD (p. 34) et la grille d'Amsler (p. 11).
 */
export function testApplicable(test: string, age: number, cfg: Pick<ReferentielScores, 'adrs' | 'had' | 'amsler'>): boolean {
  if (test === 'adrs' || test === 'had') return echellesHumeurApplicables(age, cfg).includes(test);
  if (test === 'amsler') return amslerApplicable(age, cfg);
  return true;
}
