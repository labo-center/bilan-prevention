import type { ReferentielScores } from '../referentiels/schemaScores';
import { compterOui, interpreterScore, type Interpretation, type ScoreIncomplet } from './types';

export type ResultatCast = ScoreIncomplet | { complet: true; score: number; interpretation: Interpretation };

/** Questionnaire CAST (livret p. 33) : score = nombre de réponses positives. */
export function calculerCast(
  reponses: Readonly<Record<string, boolean | undefined>>,
  cfg: ReferentielScores['cast'],
): ResultatCast {
  const r = compterOui(cfg.items, reponses);
  if (!r.complet) return r;
  return { complet: true, score: r.score, interpretation: interpreterScore(r.score, cfg.seuils) };
}
