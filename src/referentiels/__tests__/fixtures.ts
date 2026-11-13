import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const DOSSIER = resolve(import.meta.dirname, '../../../referentiels');

/** Contenu brut des référentiels réels du dépôt, au même format que lireFichiersEmbarques(). */
export function lireReferentielsReels(): Record<string, string> {
  return Object.fromEntries(
    readdirSync(DOSSIER)
      .filter((f) => f.endsWith('.json'))
      .map((f) => [`referentiels/${f}`, readFileSync(resolve(DOSSIER, f), 'utf8')]),
  );
}

export function lire4550(): Record<string, unknown> {
  return JSON.parse(lireReferentielsReels()['referentiels/45-50.json']!) as Record<string, unknown>;
}
