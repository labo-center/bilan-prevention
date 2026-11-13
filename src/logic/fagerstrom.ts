import type { ReferentielScores } from '../referentiels/schemaScores';
import { interpreterScore, sommerPoints, type Interpretation, type ScoreIncomplet } from './types';

export type ResultatFagerstrom = ScoreIncomplet | { complet: true; score: number; interpretation: Interpretation };

/** Test de Fagerström simplifié (livret p. 33). Réponses = points de l'option choisie. */
export function calculerFagerstrom(
  reponses: Readonly<{ cigarettesParJour?: number; delaiPremiereCigarette?: number }>,
  cfg: ReferentielScores['fagerstrom'],
): ResultatFagerstrom {
  const somme = sommerPoints(cfg.items, reponses);
  if (!somme.complet) return somme;
  return { complet: true, score: somme.score, interpretation: interpreterScore(somme.score, cfg.seuils) };
}

/** Convertit un nombre de cigarettes par jour en points, selon les intervalles du référentiel. */
export function pointsCigarettesParJour(nombre: number, cfg: ReferentielScores['fagerstrom']): number | null {
  if (!Number.isInteger(nombre) || nombre < 0) return null;
  const item = cfg.items.find((i) => i.id === 'cigarettesParJour');
  const option = item?.options.find((o) => (o.min ?? 0) <= nombre && (o.max === undefined || nombre <= o.max));
  return option ? option.points : null;
}
