import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { chargerReferentiels } from '../loader';
import type { ReferentielScores } from '../schemaScores';

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

/** scores.json réel, validé : les tests de logic/ éprouvent les vraies valeurs du référentiel. */
export function scoresReels(): ReferentielScores {
  const r = chargerReferentiels(lireReferentielsReels());
  if (!r.ok) throw new Error(`référentiels invalides : ${JSON.stringify(r.erreurs)}`);
  return r.scores;
}

export function lireScores(): Record<string, unknown> {
  return JSON.parse(lireReferentielsReels()['referentiels/scores.json']!) as Record<string, unknown>;
}
