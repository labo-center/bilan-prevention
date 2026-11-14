import { useEffect, useRef, type RefObject } from 'react';

const EVENEMENTS = ['pointerdown', 'keydown', 'input', 'wheel', 'touchstart'] as const;

/**
 * Appelle `surExpiration` après `minutes` sans interaction dans l'élément (M15).
 * Écouteurs et minuterie sont retirés au démontage : aucune fuite après unmount().
 */
export function useInactivite(cible: RefObject<HTMLElement | null>, actif: boolean, minutes: number, surExpiration: () => void): void {
  const rappel = useRef(surExpiration);
  useEffect(() => {
    rappel.current = surExpiration;
  });
  useEffect(() => {
    const el = cible.current;
    if (!actif || !el) return;
    let minuterie = setTimeout(() => rappel.current(), minutes * 60_000);
    const relancer = () => {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => rappel.current(), minutes * 60_000);
    };
    for (const e of EVENEMENTS) el.addEventListener(e, relancer, { passive: true });
    return () => {
      clearTimeout(minuterie);
      for (const e of EVENEMENTS) el.removeEventListener(e, relancer);
    };
  }, [cible, actif, minutes]);
}
