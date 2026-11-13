import type { RegleMapping } from '../referentiels/schemaSaisie';
import type { Bras } from './pa';
import { preRemplirFiche, type Fiche, type ReponseAQ, type ReponsesAQ, type ValeurChamp } from './preremplissage';

export interface Ouverture {
  dateRdv: string;
  dateNaissance: string;
  genre: string;
  age: number;
  trancheId: string;
}

/** Ligne de saisie de PA : une ligne incomplète n'est pas une mesure. */
export interface LignePa {
  bras: Bras;
  systolique: number | null;
  diastolique: number | null;
}

export interface TestsSaisis {
  pa: LignePa[];
  face: Record<string, number | undefined>;
  fagerstrom: { cigarettesParJour?: number; delaiPremiereCigarette?: number };
  cast: Record<string, boolean | undefined>;
  had: Record<string, number | undefined>;
  /** Résultats libres (acuité visuelle, voix chuchotée, spirométrie). */
  textes: Record<string, string | undefined>;
  /** Identifiants des alertes bloquantes acquittées par le professionnel. */
  acquittements: string[];
}

export interface Session {
  ouverture: Ouverture;
  autoquestionnaire: { reponses: ReponsesAQ; precisions: Readonly<Record<string, string>> };
  fiche: Fiche;
  tests: TestsSaisis;
}

export function creerSession(ouverture: Ouverture): Session {
  return {
    ouverture,
    autoquestionnaire: { reponses: {}, precisions: {} },
    fiche: {},
    tests: {
      pa: [
        { bras: 'gauche', systolique: null, diastolique: null },
        { bras: 'droit', systolique: null, diastolique: null },
      ],
      face: {},
      fagerstrom: {},
      cast: {},
      had: {},
      textes: {},
      acquittements: [],
    },
  };
}

export type Action =
  | { type: 'repondre'; question: string; valeur: ReponseAQ | undefined }
  | { type: 'preciser'; cle: string; texte: string }
  | { type: 'champ'; champ: string; valeur?: ValeurChamp; precision?: string }
  | { type: 'pa'; lignes: LignePa[] }
  | { type: 'face' | 'had'; item: string; points: number | undefined }
  | { type: 'cast'; item: string; oui: boolean | undefined }
  | { type: 'fagerstrom'; item: 'cigarettesParJour' | 'delaiPremiereCigarette'; points: number | undefined }
  | { type: 'texteTest'; test: string; texte: string }
  | { type: 'acquitter'; alerte: string };

/** Réducteur pur de la session : aucune dépendance à React ni au DOM. */
export function reduireSession(s: Session, a: Action, regles: readonly RegleMapping[]): Session {
  switch (a.type) {
    case 'repondre': {
      const reponses = { ...s.autoquestionnaire.reponses };
      const vide = a.valeur === undefined || (Array.isArray(a.valeur) && a.valeur.length === 0) || a.valeur === '';
      if (vide) delete reponses[a.question];
      else reponses[a.question] = a.valeur;
      return { ...s, autoquestionnaire: { ...s.autoquestionnaire, reponses }, fiche: preRemplirFiche(reponses, regles, s.fiche) };
    }
    case 'preciser':
      return { ...s, autoquestionnaire: { ...s.autoquestionnaire, precisions: { ...s.autoquestionnaire.precisions, [a.cle]: a.texte } } };
    case 'champ': {
      const actuel = s.fiche[a.champ];
      const entree = {
        valeur: 'valeur' in a ? a.valeur : actuel?.valeur,
        precision: a.precision ?? actuel?.precision,
        origine: 'saisi_professionnel' as const,
      };
      return { ...s, fiche: { ...s.fiche, [a.champ]: entree } };
    }
    case 'pa':
      return { ...s, tests: { ...s.tests, pa: a.lignes } };
    case 'face':
    case 'had':
      return { ...s, tests: { ...s.tests, [a.type]: { ...s.tests[a.type], [a.item]: a.points } } };
    case 'cast':
      return { ...s, tests: { ...s.tests, cast: { ...s.tests.cast, [a.item]: a.oui } } };
    case 'fagerstrom':
      return { ...s, tests: { ...s.tests, fagerstrom: { ...s.tests.fagerstrom, [a.item]: a.points } } };
    case 'texteTest':
      return { ...s, tests: { ...s.tests, textes: { ...s.tests.textes, [a.test]: a.texte } } };
    case 'acquitter':
      return s.tests.acquittements.includes(a.alerte)
        ? s
        : { ...s, tests: { ...s.tests, acquittements: [...s.tests.acquittements, a.alerte] } };
  }
}

/** Réponse à une question à choix multiples, en respectant les options exclusives (« Aucune », « Non »…). */
export function basculerOption(
  actuelles: readonly string[],
  option: string,
  coche: boolean,
  exclusives: readonly string[],
): string[] {
  if (!coche) return actuelles.filter((o) => o !== option);
  if (exclusives.includes(option)) return [option];
  return [...actuelles.filter((o) => !exclusives.includes(o) && o !== option), option];
}
