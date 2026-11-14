import type { ReferentielScores } from '../referentiels/schemaScores';
import { interpreterScore, sommerPoints, type Interpretation, type ScoreIncomplet } from './types';

export type ResultatFace =
  | ScoreIncomplet
  | {
      complet: true;
      score: number;
      interpretation: Interpretation;
      /** Grille appliquée ; différente du genre déclaré si celui-ci n'est pas renseigné. */
      grille: 'H' | 'F';
      /** Message affiché quand la grille la plus protectrice a été appliquée faute de genre. */
      avertissementGenre: string | null;
    };

/** Questionnaire FACE (livret p. 32) : seuils différents selon le genre. */
export function calculerFace(
  reponses: Readonly<Record<string, number | undefined>>,
  genre: string,
  cfg: ReferentielScores['face'],
): ResultatFace {
  const somme = sommerPoints(cfg.items, reponses);
  if (!somme.complet) return somme;
  const genreConnu = genre === 'H' || genre === 'F';
  const grille = genreConnu ? genre : cfg.genreNonRenseigne.appliquer;
  return {
    complet: true,
    score: somme.score,
    interpretation: interpreterScore(somme.score, cfg.seuilsParGenre[grille]),
    grille,
    avertissementGenre: genreConnu ? null : cfg.genreNonRenseigne.message,
  };
}
