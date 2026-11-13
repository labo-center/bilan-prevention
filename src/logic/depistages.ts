import type { ReferentielScores } from '../referentiels/schemaScores';

export interface Depistage {
  id: string;
  type: 'organise' | 'risque-eleve';
  libelle: string;
  modalite: string;
  /** Genre non renseigné : à proposer seulement si la personne est concernée. */
  siConcerne: boolean;
}

/**
 * Dépistages à rappeler selon l'âge et le genre (fiches thématiques p. 14).
 * Un risque élevé/très élevé déclaré remplace le dépistage organisé correspondant, quel que soit l'âge.
 */
export function depistagesApplicables(
  saisie: { age: number; genre: string; risqueEleve?: Readonly<Record<string, boolean | undefined>> },
  cfg: ReferentielScores['depistages'],
): Depistage[] {
  const { age, genre } = saisie;
  const genreConnu = genre === 'H' || genre === 'F';
  // Genre inconnu : on ne masque rien, le dépistage sexué est signalé "si concerné".
  const concerne = (genres: readonly string[]) => (genreConnu ? genres.includes(genre) : true);
  const siConcerne = (genres: readonly string[]) => !genreConnu && !(genres.includes('H') && genres.includes('F'));

  const res: Depistage[] = [];
  for (const d of cfg.organises) {
    const risque = cfg.risqueEleve.find((r) => r.id === d.id);
    if (risque && saisie.risqueEleve?.[d.id] === true) continue;
    if (concerne(d.genres) && age >= d.ageMin && age <= d.ageMax) {
      res.push({ id: d.id, type: 'organise', libelle: d.libelle, modalite: d.modalite, siConcerne: siConcerne(d.genres) });
    }
  }
  for (const r of cfg.risqueEleve) {
    if (saisie.risqueEleve?.[r.id] === true && concerne(r.genres)) {
      res.push({ id: r.id, type: 'risque-eleve', libelle: r.libelle, modalite: r.modalite, siConcerne: siConcerne(r.genres) });
    }
  }
  return res;
}
