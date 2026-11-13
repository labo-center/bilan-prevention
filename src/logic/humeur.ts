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
