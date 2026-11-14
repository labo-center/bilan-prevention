import type { ReferentielScores } from '../referentiels/schemaScores';

export interface ResultatFacturation {
  valide: boolean;
  erreurs: string[];
  acteBilan: ReferentielScores['facturation']['acteBilan'];
  actesComplementaires: string[];
}

/** Contrôle de facturation (livret p. 21) : RDP + au plus N acte(s) complémentaire(s) autorisé(s). */
export function verifierFacturation(
  codesComplementaires: readonly string[],
  cfg: ReferentielScores['facturation'],
): ResultatFacturation {
  const erreurs: string[] = [];
  const autorises = new Set(cfg.actesComplementaires.map((a) => a.code));
  for (const code of new Set(codesComplementaires)) {
    if (!autorises.has(code)) erreurs.push(`Acte non autorisé en sus du Bilan Prévention : ${code}`);
  }
  if (codesComplementaires.length > cfg.maxActesComplementaires) erreurs.push(cfg.messageDepassement);
  return { valide: erreurs.length === 0, erreurs, acteBilan: cfg.acteBilan, actesComplementaires: [...codesComplementaires] };
}
