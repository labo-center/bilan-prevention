import type { ReferentielOrientation } from '../referentiels/schemaOrientation';
import type { ReferentielScores } from '../referentiels/schemaScores';
import type { ReferentielTranche } from '../referentiels/schemas';
import type { EvaluationSession } from './evaluation';
import type { ColonnePpp, Session } from './session';

export interface LignePpp {
  thematique: string;
  libelle: string;
  /** Ligne ajoutée d'office (ex. idées suicidaires), hors du nombre maximal de priorités. */
  dOffice: boolean;
  motif: string | null;
  freins: string;
  conseils: string;
  ressources: string;
  /** Texte de ressources issu du kit d'orientation, avant toute modification. */
  ressourcesKit: string;
  /** Aucune entrée pour cette thématique dans le kit d'orientation pharmacien. */
  sansKit: boolean;
  suggestionsFreins: string[];
  suggestionsConseils: string[];
}

/** Ressources du kit d'orientation pour l'effecteur, une ligne par ressource. */
export function ressourcesKit(thematique: string, orientation: ReferentielOrientation): string | null {
  const t = orientation.kit.thematiques.find((k) => k.thematique === thematique);
  if (!t) return null;
  return t.ressources[orientation.effecteur].map((r) => `${r.categorie} : ${r.libelle}`).join('\n');
}

/** Ajoute une suggestion à une cellule, sur une nouvelle ligne, sans doublon. */
export function ajouterSuggestion(texte: string, suggestion: string): string {
  const lignes = texte.split('\n').map((l) => l.trim());
  if (lignes.includes(suggestion.trim())) return texte;
  return texte.trim() === '' ? suggestion : `${texte.replace(/\s+$/, '')}\n${suggestion}`;
}

/**
 * Construit les lignes du PPP (M13) : une par priorité, plus les ajouts d'office.
 * Ressources pré-remplies depuis le kit pharmacien ; freins et conseils vides par défaut,
 * avec des suggestions sourcées ; toute cellule modifiée par le professionnel est conservée.
 */
export function construirePpp(
  session: Session,
  evaluation: EvaluationSession,
  tranche: ReferentielTranche,
  scores: ReferentielScores,
  orientation: ReferentielOrientation,
): LignePpp[] {
  const libelles = new Map(scores.thematiques.items.map((t) => [t.id, t.libelle]));
  const declencheurs: Record<ReferentielOrientation['ajoutsDOffice'][number]['regle'], boolean> = {
    ideesSuicidaires: evaluation.ideesSuicidaires !== null,
  };

  const lignes: Array<{ thematique: string; dOffice: boolean; motif: string | null }> = session.decision.priorites.map((t) => ({
    thematique: t,
    dOffice: false,
    motif: null,
  }));
  for (const a of orientation.ajoutsDOffice) {
    if (!declencheurs[a.regle]) continue;
    const existante = lignes.find((l) => l.thematique === a.thematique);
    if (existante) existante.motif = a.motif;
    else lignes.push({ thematique: a.thematique, dOffice: true, motif: a.motif });
  }

  return lignes.map((l) => {
    const kit = ressourcesKit(l.thematique, orientation);
    const cellule = (c: ColonnePpp, defaut: string) => session.ppp.cellules[l.thematique]?.[c] ?? defaut;
    return {
      ...l,
      libelle: libelles.get(l.thematique) ?? l.thematique,
      freins: cellule('freins', ''),
      conseils: cellule('conseils', ''),
      ressources: cellule('ressources', kit ?? ''),
      ressourcesKit: kit ?? '',
      sansKit: kit === null,
      suggestionsFreins: orientation.ppp.freinsSuggeres.items,
      suggestionsConseils: tranche.conseilsPatient.items.filter((c) => c.thematique === l.thematique).map((c) => `${c.titre} : ${c.texte}`),
    };
  });
}
