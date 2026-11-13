/**
 * Accès aux données de session. v1 : implémentation "memory" uniquement (aucune persistance).
 * ui/ et logic/ ne connaissent que cette interface, jamais l'implémentation.
 */
export interface DataClient {
  readonly type: 'memory' | 'flask';
  lire<T>(cle: string): T | undefined;
  ecrire<T>(cle: string, valeur: T): void;
  /** Efface toutes les données de session (clôture, inactivité, démontage). */
  purger(): void;
  /** Nombre d'entrées détenues, utilisé par les tests de purge. */
  taille(): number;
}
