export interface BrickConfig {
  /** Implémentation du DataClient : "memory" en v1, "flask" en v2. */
  sourceDonnees: 'memory' | 'flask';
}

export const configParDefaut: BrickConfig = {
  sourceDonnees: 'memory',
};
