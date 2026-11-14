export interface BrickConfig {
  /** Implémentation du DataClient : "memory" en v1, "flask" en v2. */
  sourceDonnees: 'memory' | 'flask';
  /**
   * Adresse du PDF des fiches thématiques, ouvert à la page voulue dans le panneau latéral (S5).
   * Par défaut le fichier livré à côté de la brique (copié au build depuis docs/sources/).
   */
  urlFichesThematiques: string;
  /** Purge automatique de la session après ce délai sans interaction (M15, PGSSI-S). */
  inactiviteMinutes: number;
}

export const configParDefaut: BrickConfig = {
  sourceDonnees: 'memory',
  urlFichesThematiques: 'fiches-thematiques.pdf',
  inactiviteMinutes: 30,
};
