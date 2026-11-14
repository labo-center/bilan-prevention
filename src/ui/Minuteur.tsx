import { useEffect, useState } from 'react';
import { etatMinuteur } from '../logic/minuteur';
import styles from './Parcours.module.css';

/** Durée de l'entretien, avec repères du livret ; passe en orange au dernier repère sans interrompre la saisie (S3). */
export function Minuteur({ debut, reperesMinutes }: { debut: number; reperesMinutes: readonly number[] }) {
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const e = etatMinuteur(maintenant - debut, reperesMinutes);
  return (
    <p className={e.depasse ? styles.minuteurDepasse : styles.minuteur} data-testid="minuteur" data-depasse={e.depasse}>
      Durée de l’entretien : <strong>{e.affichage}</strong>
      {e.repereAtteint !== null && <span> - {e.repereAtteint} min {e.depasse ? 'dépassées' : 'atteintes'}</span>}
      <span className={styles.aide}> (repères : {reperesMinutes.join(' et ')} min)</span>
    </p>
  );
}
