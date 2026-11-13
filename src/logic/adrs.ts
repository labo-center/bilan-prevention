import type { ReferentielScores } from '../referentiels/schemaScores';
import { compterOui, interpreterScore, type Interpretation, type ScoreIncomplet } from './types';

export type ResultatAdrs = ScoreIncomplet | { complet: true; score: number; interpretation: Interpretation };

/** Échelle ADRS (livret p. 34) : score = nombre de réponses « vrai ». */
export function calculerAdrs(
  reponses: Readonly<Record<string, boolean | undefined>>,
  cfg: ReferentielScores['adrs'],
): ResultatAdrs {
  const r = compterOui(cfg.items, reponses);
  if (!r.complet) return r;
  return { complet: true, score: r.score, interpretation: interpreterScore(r.score, cfg.seuils) };
}
