import type { ReactNode } from 'react';
import type { Niveau } from '../logic/types';
import styles from './Parcours.module.css';

const CLASSE: Record<Niveau, string | undefined> = {
  rouge: styles.niveauRouge,
  orange: styles.niveauOrange,
  info: styles.niveauInfo,
  aucun: styles.niveauAucun,
};

/** Encadré de résultat coloré selon le niveau de risque. */
export function Resultat({ niveau, children, aVerifier }: { niveau: Niveau; children: ReactNode; aVerifier?: boolean }) {
  return (
    <div className={`${styles.resultat} ${CLASSE[niveau] ?? ''}`} data-niveau={niveau} role={niveau === 'rouge' ? 'alert' : 'status'}>
      {children}
      {aVerifier && <AVerifier />}
    </div>
  );
}

export function AVerifier() {
  return <span className={styles.badgeAVerifier}>à vérifier</span>;
}

export function Declare() {
  return <span className={styles.badgeDeclare}>Déclaré par le patient</span>;
}

/** Saisie en cours : le score n'est calculé qu'une fois toutes les réponses données. */
export function Incomplet({ manquants }: { manquants: number }) {
  return (
    <p className={styles.incomplet}>
      Score non calculé : {manquants} réponse{manquants > 1 ? 's' : ''} manquante{manquants > 1 ? 's' : ''}.
    </p>
  );
}
