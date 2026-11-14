import { useId } from 'react';
import styles from './Parcours.module.css';

/**
 * Saisie numérique non contrôlée : la valeur affichée appartient au navigateur pendant la frappe
 * (« 1, » ou « 1. » restent saisissables) ; seule la valeur analysée remonte.
 */
export function ChampNombre({
  libelle,
  valeur,
  unite,
  min,
  max,
  pas,
  onChange,
  grand,
}: {
  libelle: string;
  valeur: number | undefined;
  unite?: string | undefined;
  min?: number;
  max?: number;
  pas?: number;
  onChange: (v: number | undefined) => void;
  grand?: boolean;
}) {
  const id = useId();
  return (
    <div className={grand ? styles.champNombreGrand : styles.champNombre}>
      <label htmlFor={id}>{libelle}</label>
      <span className={styles.ligneNombre}>
        <input
          id={id}
          type="number"
          inputMode="decimal"
          defaultValue={valeur ?? ''}
          min={min}
          max={max}
          step={pas ?? 'any'}
          onChange={(e) => {
            const brut = e.target.value.replace(',', '.');
            const n = brut === '' ? undefined : Number(brut);
            onChange(n === undefined || Number.isNaN(n) ? undefined : n);
          }}
        />
        {unite && <span>{unite}</span>}
      </span>
    </div>
  );
}
