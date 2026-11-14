import type { Conclusion, ReferentielScores } from '../referentiels/schemaScores';
import type { Interpretation } from './types';

const versInterpretation = (c: Conclusion): Interpretation => ({
  niveau: c.niveau,
  message: c.message,
  aVerifier: c.aVerifier ?? false,
});

/** Test d'Amsler (livret p. 29) : anomalie → orientation ophtalmologique rapide. */
export function evaluerAmsler(anormal: boolean | undefined, cfg: ReferentielScores['amsler']): Interpretation | null {
  return anormal === true ? versInterpretation(cfg.siAnormal) : null;
}

/** Polymédication (kit d'orientation p. 41) : au-delà du nombre de traitements du référentiel. */
export function evaluerPolymedication(
  nombreTraitements: number | undefined,
  cfg: ReferentielScores['polymedication'],
): Interpretation | null {
  if (nombreTraitements === undefined || !Number.isFinite(nombreTraitements)) return null;
  return nombreTraitements > cfg.nombreTraitementsMax ? versInterpretation(cfg.siDepasse) : null;
}

/** Idées suicidaires (kit d'orientation p. 43) : alerte rouge, 31 14, thématique bien-être mental. */
export function evaluerIdeesSuicidaires(
  coche: boolean | undefined,
  cfg: ReferentielScores['ideesSuicidaires'],
): (Interpretation & { thematique: string }) | null {
  return coche === true ? { ...versInterpretation(cfg.siCoche), thematique: cfg.siCoche.thematique } : null;
}

/** Absence de médecin traitant (fiche de repérage p. 1). */
export function evaluerMedecinTraitant(
  aUnMedecinTraitant: boolean | undefined,
  cfg: ReferentielScores['medecinTraitant'],
): Interpretation | null {
  return aUnMedecinTraitant === false ? versInterpretation(cfg.siAbsent) : null;
}

/** Repères de consommation d'alcool (autoquestionnaire Q33) : un seul repère dépassé suffit. */
export function evaluerReperesAlcool(
  reponses: Readonly<Record<string, boolean | undefined>>,
  cfg: ReferentielScores['reperesAlcool'],
): (Interpretation & { reperesDepasses: string[] }) | null {
  const depasses = cfg.reperes.filter((r) => reponses[r.id] === true).map((r) => r.id);
  return depasses.length > 0 ? { ...versInterpretation(cfg.siDepasse), reperesDepasses: depasses } : null;
}
