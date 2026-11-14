import type { ReferentielTranche } from '../referentiels/schemas';
import type { Risque } from './risques';
import type { ReponsesAQ } from './preremplissage';

export interface ThematiqueProposee {
  thematique: string;
  /** Niveau le plus grave des risques de la thématique, null si seulement souhaitée par le patient. */
  niveauMax: Risque['niveau'] | null;
  nbRisques: number;
  /** Le patient a demandé à aborder ce sujet (Q46). */
  souhaitee: boolean;
}

const RANG = { rouge: 0, orange: 1, info: 2 } as const;

/** Thématiques souhaitées par le patient d'après la question « sujets à aborder ». */
export function thematiquesSouhaitees(reponses: ReponsesAQ, souhaits: ReferentielTranche['souhaitsPatient']): string[] {
  const choisies = [reponses[souhaits.question]].flat().filter((x): x is string => typeof x === 'string');
  const res: string[] = [];
  for (const c of souhaits.correspondances) {
    if (choisies.includes(c.option)) for (const t of c.thematiques) if (!res.includes(t)) res.push(t);
  }
  return res;
}

/**
 * Thématiques à proposer pour la décision partagée : celles des risques repérés et celles souhaitées
 * par le patient. Tri : niveau le plus grave d'abord, puis souhait du patient, puis ordre d'apparition.
 */
export function thematiquesAPrioriser(risques: readonly Risque[], souhaitees: readonly string[]): ThematiqueProposee[] {
  const parTheme = new Map<string, ThematiqueProposee>();
  for (const r of risques) {
    const t = parTheme.get(r.theme) ?? { thematique: r.theme, niveauMax: null, nbRisques: 0, souhaitee: false };
    t.nbRisques += 1;
    if (t.niveauMax === null || RANG[r.niveau] < RANG[t.niveauMax]) t.niveauMax = r.niveau;
    parTheme.set(r.theme, t);
  }
  for (const s of souhaitees) {
    const t = parTheme.get(s) ?? { thematique: s, niveauMax: null, nbRisques: 0, souhaitee: false };
    t.souhaitee = true;
    parTheme.set(s, t);
  }
  const ordre = [...parTheme.values()];
  return ordre
    .map((t, i) => ({ t, i }))
    .sort(
      (a, b) =>
        (a.t.niveauMax === null ? 3 : RANG[a.t.niveauMax]) - (b.t.niveauMax === null ? 3 : RANG[b.t.niveauMax]) ||
        Number(b.t.souhaitee) - Number(a.t.souhaitee) ||
        a.i - b.i,
    )
    .map((x) => x.t);
}
