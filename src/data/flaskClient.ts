import type { DataClient } from './DataClient';

/** Réservé à la v2 (backend Flask local, PRD §6.5 incrément 7). */
export function creerFlaskClient(): DataClient {
  throw new Error('Source de données "flask" non disponible en v1 : utiliser "memory".');
}
