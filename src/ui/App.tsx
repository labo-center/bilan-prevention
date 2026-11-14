import { useEffect, useState } from 'react';
import { useBrick } from '../context';
import { creerSession, reduireSession, type Action, type Ouverture, type Session } from '../logic/session';
import type { ResultatChargement } from '../referentiels/loader';
import { ErreurReferentiels } from './ErreurReferentiels';
import { OuvertureSession } from './OuvertureSession';
import { Parcours } from './Parcours';
import styles from './App.module.css';

const CLE_SESSION = 'session';

export function App({ chargement }: { chargement: ResultatChargement }) {
  const { data } = useBrick();
  const [session, setSession] = useState<Session | null>(() => data.lire<Session>(CLE_SESSION) ?? null);

  // Mémoire vive uniquement : le DataClient "memory" n'écrit rien dans le navigateur.
  useEffect(() => {
    if (session) data.ecrire(CLE_SESSION, session);
  }, [session, data]);

  if (!chargement.ok) return <ErreurReferentiels erreurs={chargement.erreurs} />;

  const tranche = session ? chargement.tranches.find((t) => t.tranche.id === session.ouverture.trancheId) : undefined;

  const ouvrir = (o: Ouverture) => setSession(creerSession(o));
  const cloturer = () => {
    data.purger();
    setSession(null);
  };
  const dispatch = (a: Action) =>
    setSession((s) => (s && tranche ? reduireSession(s, a, tranche.mapping.regles) : s));

  return (
    <div className={styles.app}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Copilote Mon Bilan Prévention</h1>
      </header>
      <main className={styles.contenu}>
        {session && tranche ? (
          <Parcours
            session={session}
            tranche={tranche}
            scores={chargement.scores}
            orientation={chargement.orientation}
            dispatch={dispatch}
            onCloturer={cloturer}
          />
        ) : (
          <OuvertureSession tranches={chargement.tranches} onOuvrir={ouvrir} />
        )}
      </main>
    </div>
  );
}
