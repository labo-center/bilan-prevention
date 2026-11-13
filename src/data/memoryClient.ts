import type { DataClient } from './DataClient';

/** Stockage en mémoire vive uniquement : rien n'est écrit dans le navigateur ni envoyé sur le réseau. */
export function creerMemoryClient(): DataClient {
  const donnees = new Map<string, unknown>();
  return {
    type: 'memory',
    lire: <T,>(cle: string) => donnees.get(cle) as T | undefined,
    ecrire: (cle, valeur) => {
      donnees.set(cle, valeur);
    },
    purger: () => donnees.clear(),
    taille: () => donnees.size,
  };
}
