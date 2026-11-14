import { useEffect, useRef } from 'react';
import { useBrick } from '../context';
import type { ReferentielScores } from '../referentiels/schemaScores';
import styles from './Parcours.module.css';

/** Fiche thématique officielle ouverte à sa page, en panneau latéral, sans quitter la session (S5). */
export function PanneauFiche({ thematique, scores, onFermer }: { thematique: string; scores: ReferentielScores; onFermer: () => void }) {
  const { config } = useBrick();
  const fiche = scores.thematiques.items.find((t) => t.id === thematique);
  const fermer = useRef<HTMLButtonElement>(null);
  useEffect(() => fermer.current?.focus(), [thematique]);
  if (!fiche) return null;
  return (
    <aside className={styles.panneauFiche} aria-label={`Fiche thématique : ${fiche.libelle}`}>
      <div className={styles.entetePanneau}>
        <h2 className={styles.titreSection}>Fiche thématique : {fiche.libelle}</h2>
        <button ref={fermer} type="button" className={styles.boutonSecondaire} onClick={onFermer}>
          Fermer la fiche
        </button>
      </div>
      <p className={styles.aide}>
        Page {fiche.pageFiche} du document officiel. Si la fiche ne s’affiche pas sur cet appareil :{' '}
        <a href={`${config.urlFichesThematiques}#page=${fiche.pageFiche}`} target="_blank" rel="noopener noreferrer">
          ouvrir la fiche dans un nouvel onglet
        </a>
        .
      </p>
      <iframe
        className={styles.cadreFiche}
        title={`Fiche thématique ${fiche.libelle}, page ${fiche.pageFiche}`}
        src={`${config.urlFichesThematiques}#page=${fiche.pageFiche}`}
      />
    </aside>
  );
}

/** Bouton d'ouverture de la fiche thématique liée. */
export function BoutonFiche({ thematique, libelle, ouvrir }: { thematique: string; libelle: string; ouvrir: (t: string) => void }) {
  return (
    <button type="button" className={styles.boutonLien} onClick={() => ouvrir(thematique)} aria-label={`Ouvrir la fiche thématique ${libelle}`}>
      Fiche thématique
    </button>
  );
}
