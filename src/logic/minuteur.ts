export interface EtatMinuteur {
  /** Durée écoulée formatée « mm:ss » (ou « h:mm:ss » au-delà d'une heure). */
  affichage: string;
  minutes: number;
  /** Dernier repère atteint (en minutes), null avant le premier. */
  repereAtteint: number | null;
  /** Dernier repère dépassé : le minuteur passe en orange, sans interrompre la saisie (S3). */
  depasse: boolean;
}

/** État du minuteur d'entretien à partir de la durée écoulée et des repères du référentiel. */
export function etatMinuteur(ecouleMs: number, reperesMinutes: readonly number[]): EtatMinuteur {
  const totalSecondes = Math.max(0, Math.floor(ecouleMs / 1000));
  const h = Math.floor(totalSecondes / 3600);
  const m = Math.floor((totalSecondes % 3600) / 60);
  const s = totalSecondes % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  const minutes = totalSecondes / 60;
  const atteints = reperesMinutes.filter((r) => minutes >= r);
  return {
    affichage: h > 0 ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`,
    minutes: Math.floor(minutes),
    repereAtteint: atteints.at(-1) ?? null,
    depasse: reperesMinutes.length > 0 && minutes >= reperesMinutes.at(-1)!,
  };
}
