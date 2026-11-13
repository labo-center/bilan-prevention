import type { PropsEtape } from './Parcours';
import { AVerifier } from './Resultat';
import styles from './Parcours.module.css';

const LIBELLE_NIVEAU = { rouge: 'Alerte', orange: 'À orienter', info: 'Information' } as const;

/** Risques repérés, triés rouge > orange > info (base de la matrice des risques, M12). */
export function RisquesReperes({ evaluation: ev, scores }: PropsEtape) {
  const themes = new Map(scores.thematiques.items.map((t) => [t.id, t.libelle]));
  return (
    <div>
      <h2 className={styles.titreEtape}>Risques repérés</h2>
      {ev.risques.length === 0 ? (
        <p className={styles.aide}>Aucun risque repéré à ce stade.</p>
      ) : (
        <ol className={styles.listeRisques} aria-label="Risques repérés, du plus au moins grave">
          {ev.risques.map((r) => (
            <li key={r.id} className={`${styles.risque} ${styles[`risque_${r.niveau}`] ?? ''}`} data-niveau={r.niveau} data-risque={r.id}>
              <span className={styles.niveauRisque}>{LIBELLE_NIVEAU[r.niveau]}</span>
              <span className={styles.themeRisque}>{themes.get(r.theme) ?? r.theme}</span>
              <span>{r.message} {r.aVerifier && <AVerifier />}</span>
              <span className={styles.sourceRisque}>{r.source}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
