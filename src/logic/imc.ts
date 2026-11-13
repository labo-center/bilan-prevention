import type { ReferentielScores } from '../referentiels/schemaScores';
import { interpreterScore, type Interpretation } from './types';

export type ResultatImc =
  | { calculable: false; raison: 'poids-manquant' | 'taille-manquante' | 'valeur-invalide' }
  | { calculable: true; imc: number; interpretation: Interpretation };

/** IMC = poids (kg) / taille (m)², arrondi au nombre de décimales du référentiel. */
export function calculerImc(
  saisie: { poidsKg?: number | null; tailleM?: number | null },
  cfg: ReferentielScores['imc'],
): ResultatImc {
  const { poidsKg, tailleM } = saisie;
  if (poidsKg === undefined || poidsKg === null) return { calculable: false, raison: 'poids-manquant' };
  if (tailleM === undefined || tailleM === null) return { calculable: false, raison: 'taille-manquante' };
  if (!Number.isFinite(poidsKg) || !Number.isFinite(tailleM) || poidsKg <= 0 || tailleM <= 0) {
    return { calculable: false, raison: 'valeur-invalide' };
  }
  const facteur = 10 ** cfg.decimales;
  const imc = Math.round((poidsKg / (tailleM * tailleM) + Number.EPSILON) * facteur) / facteur;
  return { calculable: true, imc, interpretation: interpreterScore(imc, cfg.seuils) };
}
