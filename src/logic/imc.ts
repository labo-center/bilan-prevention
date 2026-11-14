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
  // Le calcul en virgule flottante donne 35,2 / 1,6² = 13,7499999… au lieu de 13,75 : on élimine ce bruit
  // (12 chiffres significatifs) avant d'arrondir au plus proche, demi vers le haut. Vérifié par l'oracle.
  const brut = Number(((poidsKg / (tailleM * tailleM)) * facteur).toPrecision(12));
  const imc = Math.round(brut) / facteur;
  return { calculable: true, imc, interpretation: interpreterScore(imc, cfg.seuils) };
}
