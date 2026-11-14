import { useEffect, useRef, useState } from 'react';
import { useBrick } from '../context';
import { creerSession, reduireSession, type Action, type Ouverture, type Session } from '../logic/session';
import type { ResultatChargement } from '../referentiels/loader';
import { ErreurReferentiels } from './ErreurReferentiels';
import { OuvertureSession } from './OuvertureSession';
import { Parcours } from './Parcours';
import { useInactivite } from './useInactivite';
import styles from './App.module.css';

const CLE_SESSION = 'session';

export function App({ chargement }: { chargement: ResultatChargement }) {
  const { data, config, theme } = useBrick();
  const [themeActif, setThemeActif] = useState(theme);
  const racine = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<Session | null>(() => data.lire<Session>(CLE_SESSION) ?? null);
  const [avis, setAvis] = useState<string | null>(null);

  // Mémoire vive uniquement : le DataClient "memory" n'écrit rien dans le navigateur.
  useEffect(() => {
    if (session) data.ecrire(CLE_SESSION, session);
  }, [session, data]);

  /** Purge complète (M15) : DataClient vidé et état React remis à zéro, l'interface ne garde aucune donnée. */
  const purger = (message: string) => {
    data.purger();
    setSession(null);
    setAvis(message);
  };
  useInactivite(racine, session !== null, config.inactiviteMinutes, () =>
    purger(`Session clôturée après ${config.inactiviteMinutes} minutes d’inactivité : toutes les données saisies ont été effacées.`),
  );

  if (!chargement.ok) return <ErreurReferentiels erreurs={chargement.erreurs} />;

  const tranche = session ? chargement.tranches.find((t) => t.tranche.id === session.ouverture.trancheId) : undefined;

  const ouvrir = (o: Ouverture) => {
    setAvis(null);
    // Thème recommandé par la tranche (grands caractères pour les 70-75 ans, PRD C3), modifiable ensuite.
    const recommande = chargement.ok ? chargement.tranches.find((t) => t.tranche.id === o.trancheId)?.affichage?.themeRecommande : undefined;
    if (recommande) setThemeActif(recommande);
    setSession(creerSession(o, Date.now()));
  };
  const dispatch = (a: Action) => setSession((s) => (s && tranche ? reduireSession(s, a, tranche.mapping.regles) : s));

  return (
    <div className={styles.app} ref={racine} data-theme={themeActif}>
      <header className={styles.entete}>
        <h1 className={styles.titre}>Copilote Mon Bilan Prévention</h1>
        <button
          type="button"
          className={styles.bascule}
          aria-pressed={themeActif === 'contraste'}
          onClick={() => setThemeActif(themeActif === 'contraste' ? 'clair' : 'contraste')}
        >
          Grands caractères
        </button>
      </header>
      <main className={styles.contenu}>
        {session && tranche ? (
          <Parcours
            session={session}
            tranche={tranche}
            scores={chargement.scores}
            orientation={chargement.orientation}
            dispatch={dispatch}
            onCloturer={() => purger('Session clôturée : toutes les données saisies ont été effacées.')}
          />
        ) : (
          <>
            {avis && <p role="status" className={styles.avis}>{avis}</p>}
            <OuvertureSession tranches={chargement.tranches} onOuvrir={ouvrir} />
          </>
        )}
      </main>
    </div>
  );
}
