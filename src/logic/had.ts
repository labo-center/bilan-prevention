import type { ReferentielScores } from '../referentiels/schemaScores';
import { interpreterScore, sommerPoints, type Interpretation, type ScoreIncomplet } from './types';

export type ResultatDimensionHad =
  | (ScoreIncomplet & { dimension: string; libelle: string })
  | { complet: true; dimension: string; libelle: string; score: number; interpretation: Interpretation };

/** Échelle HAD (livret p. 34-35) : un score et une interprétation par dimension (A et D). */
export function calculerHad(
  reponses: Readonly<Record<string, number | undefined>>,
  cfg: ReferentielScores['had'],
): ResultatDimensionHad[] {
  return cfg.dimensions.map((d) => {
    const somme = sommerPoints(
      cfg.items.filter((i) => i.dimension === d.id),
      reponses,
    );
    if (!somme.complet) return { ...somme, dimension: d.id, libelle: d.libelle };
    return {
      complet: true,
      dimension: d.id,
      libelle: d.libelle,
      score: somme.score,
      interpretation: interpreterScore(somme.score, cfg.seuils),
    };
  });
}
