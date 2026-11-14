import type { ErreurReferentiel } from '../referentiels/loader';
import styles from './App.module.css';

/** Écran bloquant : un référentiel invalide empêche toute ouverture de session (M16). */
export function ErreurReferentiels({ erreurs }: { erreurs: ErreurReferentiel[] }) {
  return (
    <div className={styles.app}>
      <div role="alert" className={styles.alerteRouge}>
        <h1 className={styles.titreAlerte}>Démarrage impossible : référentiel invalide</h1>
        <p>Corriger le ou les fichiers ci-dessous puis recharger l'application.</p>
        <table className={styles.tableau}>
          <thead>
            <tr>
              <th scope="col">Fichier</th>
              <th scope="col">Champ</th>
              <th scope="col">Erreur</th>
            </tr>
          </thead>
          <tbody>
            {erreurs.map((e, i) => (
              <tr key={i}>
                <td><code>{e.fichier}</code></td>
                <td><code>{e.champ}</code></td>
                <td>{e.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
