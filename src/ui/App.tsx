import { useState } from 'react';
import { useBrick } from '../context';
import type { ResultatChargement } from '../referentiels/loader';
import { ErreurReferentiels } from './ErreurReferentiels';
import { OuvertureSession, type DonneesOuverture } from './OuvertureSession';
import { SessionOuverte } from './SessionOuverte';
import styles from './App.module.css';

const CLE_SESSION = 'session';

export function App({ chargement }: { chargement: ResultatChargement }) {
  const { data } = useBrick();
  const [session, setSession] = useState<DonneesOuverture | null>(() => data.lire<DonneesOuverture>(CLE_SESSION) ?? null);

  if (!chargement.ok) return <ErreurReferentiels erreurs={chargement.erreurs} />;

  const ouvrir = (d: DonneesOuverture) => {
    data.ecrire(CLE_SESSION, d);
    setSession(d);
  };
  const cloturer = () => {
    data.purger();
    setSession(null);
  };

  const referentiel = session ? chargement.tranches.find((t) => t.tranche.id === session.trancheId) : undefined;

  return (
    <div className={styles.app}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Copilote Mon Bilan Prévention</h1>
      </header>
      <main className={styles.contenu}>
        {session && referentiel ? (
          <SessionOuverte session={session} referentiel={referentiel} onCloturer={cloturer} />
        ) : (
          <OuvertureSession tranches={chargement.tranches} onOuvrir={ouvrir} />
        )}
      </main>
    </div>
  );
}
