import { schemaReferentielTranche, type ReferentielTranche } from './schemas';

export interface ErreurReferentiel {
  /** Chemin du fichier, ex. "referentiels/45-50.json". */
  fichier: string;
  /** Champ en erreur (notation pointée), "(racine)" si le fichier entier est en cause. */
  champ: string;
  message: string;
}

export type ResultatChargement =
  | { ok: true; tranches: ReferentielTranche[] }
  | { ok: false; erreurs: ErreurReferentiel[] };

/** Les fichiers de tranche sont nommés "AA-AA.json" ; les autres (scores, orientation) ont leur propre schéma. */
const MOTIF_FICHIER_TRANCHE = /(?:^|\/)(\d{2}-\d{2})\.json$/;

function formaterChemin(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(racine)';
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : `${i === 0 ? '' : '.'}${String(p)}`))
    .join('');
}

/**
 * Parse et valide les référentiels de tranche fournis sous forme de texte brut.
 * Fonction pure : aucune lecture disque ni réseau, ce qui la rend testable sans navigateur.
 * @param fichiers dictionnaire chemin -> contenu JSON brut
 */
export function chargerReferentiels(fichiers: Record<string, string>): ResultatChargement {
  const erreurs: ErreurReferentiel[] = [];
  const tranches: ReferentielTranche[] = [];

  const chemins = Object.keys(fichiers)
    .filter((c) => MOTIF_FICHIER_TRANCHE.test(c))
    .sort();

  if (chemins.length === 0) {
    return { ok: false, erreurs: [{ fichier: 'referentiels/', champ: '(racine)', message: 'aucun référentiel de tranche trouvé' }] };
  }

  for (const chemin of chemins) {
    const fichier = chemin.replace(/^.*?referentiels\//, 'referentiels/');
    let brut: unknown;
    try {
      brut = JSON.parse(fichiers[chemin] ?? '');
    } catch (e) {
      erreurs.push({ fichier, champ: '(racine)', message: `JSON invalide : ${(e as Error).message}` });
      continue;
    }
    const resultat = schemaReferentielTranche.safeParse(brut);
    if (!resultat.success) {
      for (const issue of resultat.error.issues) {
        erreurs.push({ fichier, champ: formaterChemin(issue.path), message: issue.message });
      }
      continue;
    }
    const idAttendu = MOTIF_FICHIER_TRANCHE.exec(chemin)?.[1];
    if (resultat.data.tranche.id !== idAttendu) {
      erreurs.push({ fichier, champ: 'tranche.id', message: `doit valoir "${idAttendu}" (nom du fichier)` });
      continue;
    }
    tranches.push(resultat.data);
  }

  // Contrôle croisé : deux tranches ne doivent jamais se chevaucher.
  const triees = [...tranches].sort((a, b) => a.tranche.ageMin - b.tranche.ageMin);
  for (let i = 1; i < triees.length; i++) {
    const prec = triees[i - 1]!;
    const cour = triees[i]!;
    if (cour.tranche.ageMin <= prec.tranche.ageMax) {
      erreurs.push({
        fichier: `referentiels/${cour.tranche.id}.json`,
        champ: 'tranche.ageMin',
        message: `chevauche la tranche ${prec.tranche.id}`,
      });
    }
  }

  return erreurs.length > 0 ? { ok: false, erreurs } : { ok: true, tranches: triees };
}

/** Lit les fichiers JSON du dossier referentiels/ embarqués au build (texte brut, parsé par chargerReferentiels). */
export function lireFichiersEmbarques(): Record<string, string> {
  return import.meta.glob('../../referentiels/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<
    string,
    string
  >;
}
