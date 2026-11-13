import type { z } from 'zod';
import { schemaReferentielTranche, type ReferentielTranche } from './schemas';
import { schemaScores, type ReferentielScores } from './schemaScores';

export interface ErreurReferentiel {
  /** Chemin du fichier, ex. "referentiels/45-50.json". */
  fichier: string;
  /** Champ en erreur (notation pointée), "(racine)" si le fichier entier est en cause. */
  champ: string;
  message: string;
}

export type ResultatChargement =
  | { ok: true; tranches: ReferentielTranche[]; scores: ReferentielScores }
  | { ok: false; erreurs: ErreurReferentiel[] };

/** Les fichiers de tranche sont nommés "AA-AA.json" ; les autres (scores, orientation) ont leur propre schéma. */
const MOTIF_FICHIER_TRANCHE = /(?:^|\/)(\d{2}-\d{2})\.json$/;
const MOTIF_FICHIER_SCORES = /(?:^|\/)scores\.json$/;

const normaliser = (chemin: string) => chemin.replace(/^.*?referentiels\//, 'referentiels/');

/** Parse puis valide un fichier ; ajoute les erreurs (fichier + champ) et retourne null en cas d'échec. */
function valider<T>(chemin: string, contenu: string, schema: z.ZodType<T>, erreurs: ErreurReferentiel[]): T | null {
  const fichier = normaliser(chemin);
  let brut: unknown;
  try {
    brut = JSON.parse(contenu);
  } catch (e) {
    erreurs.push({ fichier, champ: '(racine)', message: `JSON invalide : ${(e as Error).message}` });
    return null;
  }
  const resultat = schema.safeParse(brut);
  if (!resultat.success) {
    for (const issue of resultat.error.issues) {
      erreurs.push({ fichier, champ: formaterChemin(issue.path), message: issue.message });
    }
    return null;
  }
  return resultat.data;
}

function formaterChemin(path: readonly PropertyKey[]): string {
  if (path.length === 0) return '(racine)';
  return path
    .map((p, i) => (typeof p === 'number' ? `[${p}]` : `${i === 0 ? '' : '.'}${String(p)}`))
    .join('');
}

/**
 * Parse et valide les référentiels (tranches + scores) fournis sous forme de texte brut.
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
    const ref = valider(chemin, fichiers[chemin] ?? '', schemaReferentielTranche, erreurs);
    if (!ref) continue;
    const idAttendu = MOTIF_FICHIER_TRANCHE.exec(chemin)?.[1];
    if (ref.tranche.id !== idAttendu) {
      erreurs.push({ fichier: normaliser(chemin), champ: 'tranche.id', message: `doit valoir "${idAttendu}" (nom du fichier)` });
      continue;
    }
    tranches.push(ref);
  }

  const cheminScores = Object.keys(fichiers).find((c) => MOTIF_FICHIER_SCORES.test(c));
  const scores = cheminScores ? valider(cheminScores, fichiers[cheminScores] ?? '', schemaScores, erreurs) : null;
  if (!cheminScores) {
    erreurs.push({ fichier: 'referentiels/scores.json', champ: '(racine)', message: 'fichier absent' });
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

  // Contrôle croisé : les thématiques de la fiche de repérage existent dans scores.json.
  if (scores) {
    const ids = new Set(scores.thematiques.items.map((t) => t.id));
    for (const t of triees) {
      t.ficheReperage.sections.forEach((s, i) => {
        const verifier = (th: string | undefined, champ: string) => {
          if (th && !ids.has(th)) erreurs.push({ fichier: `referentiels/${t.tranche.id}.json`, champ, message: `thématique "${th}" inconnue de scores.json` });
        };
        verifier(s.thematique, `ficheReperage.sections[${i}].thematique`);
        s.champs.forEach((c, j) => verifier(c.thematique, `ficheReperage.sections[${i}].champs[${j}].thematique`));
      });
      // Les repères alcool de scores.json doivent être des options de la question liée.
      const q = t.autoquestionnaire.sections.flatMap((s) => s.questions).find((x) => x.id === t.liaisons.questionReperesAlcool);
      const options = q && 'options' in q ? q.options.map((o) => o.id) : [];
      for (const rep of scores.reperesAlcool.reperes) {
        if (!options.includes(rep.id)) {
          erreurs.push({ fichier: `referentiels/${t.tranche.id}.json`, champ: 'liaisons.questionReperesAlcool', message: `option "${rep.id}" de scores.json absente de la question` });
        }
      }
    }
  }

  if (erreurs.length > 0 || !scores) return { ok: false, erreurs };
  return { ok: true, tranches: triees, scores };
}

/** Lit les fichiers JSON du dossier referentiels/ embarqués au build (texte brut, parsé par chargerReferentiels). */
export function lireFichiersEmbarques(): Record<string, string> {
  return import.meta.glob('../../referentiels/*.json', { eager: true, query: '?raw', import: 'default' }) as Record<
    string,
    string
  >;
}
