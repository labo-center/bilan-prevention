import type { Niveau, ReferentielScores } from '../referentiels/schemaScores';

export type Bras = 'gauche' | 'droit';

export interface MesurePa {
  bras: Bras;
  systolique: number;
  diastolique: number;
}

export interface PaRetenue {
  bras: Bras;
  /** Moyennes non arrondies : la comparaison aux seuils se fait sur la valeur exacte. */
  systolique: number;
  diastolique: number;
  nbMesures: number;
}

export type ResultatPa =
  | { complet: false; raison: 'mesures-insuffisantes'; nbMesures: number; mesuresMin: number }
  | { complet: false; raison: 'mesure-invalide'; index: number }
  | { complet: true; retenue: PaRetenue; niveau: Niveau; message: string | null; bloquant: boolean };

const RANG: Record<Niveau, number> = { aucun: 0, info: 1, orange: 2, rouge: 3 };

function classer(sys: number, dia: number, cfg: ReferentielScores['pressionArterielle']) {
  // Seuils classés du plus sévère au moins sévère ; dépassement si systolique OU diastolique.
  const s = cfg.seuils.find((x) => sys >= x.systolique || dia >= x.diastolique);
  return s
    ? { niveau: s.niveau, message: s.message, bloquant: s.bloquant }
    : { niveau: 'aucun' as const, message: null, bloquant: false };
}

/**
 * PA retenue (livret p. 29) : au moins N mesures ; moyenne par bras, puis le bras "le plus haut",
 * c'est-à-dire celui dont la moyenne est la plus sévère au regard des seuils, puis la plus haute systolique.
 */
export function evaluerPa(mesures: readonly MesurePa[], cfg: ReferentielScores['pressionArterielle']): ResultatPa {
  const index = mesures.findIndex(
    (m) =>
      !Number.isFinite(m.systolique) ||
      !Number.isFinite(m.diastolique) ||
      m.diastolique <= 0 ||
      m.systolique <= m.diastolique,
  );
  if (index >= 0) return { complet: false, raison: 'mesure-invalide', index };
  if (mesures.length < cfg.mesuresMin) {
    return { complet: false, raison: 'mesures-insuffisantes', nbMesures: mesures.length, mesuresMin: cfg.mesuresMin };
  }

  const candidats = (['gauche', 'droit'] as const)
    .map((bras) => {
      const m = mesures.filter((x) => x.bras === bras);
      if (m.length === 0) return null;
      const systolique = m.reduce((t, x) => t + x.systolique, 0) / m.length;
      const diastolique = m.reduce((t, x) => t + x.diastolique, 0) / m.length;
      return { retenue: { bras, systolique, diastolique, nbMesures: m.length }, ...classer(systolique, diastolique, cfg) };
    })
    .filter((c) => c !== null)
    .sort(
      (a, b) =>
        RANG[b.niveau] - RANG[a.niveau] ||
        b.retenue.systolique - a.retenue.systolique ||
        b.retenue.diastolique - a.retenue.diastolique,
    );

  return { complet: true, ...candidats[0]! };
}
