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

export interface EntretienThematique {
  stade?: string;
  /** Cases de la balance décisionnelle, par identifiant de case. */
  balance: Readonly<Record<string, string>>;
  /** Balance affichée à la demande hors des stades recommandés. */
  balanceOuverte?: boolean;
}

export type ColonnePpp = 'freins' | 'conseils' | 'ressources';

export interface DecisionPartagee {
  /** Thématiques priorisées (1 ou 2), dans l'ordre de sélection. */
  priorites: string[];
  entretiens: Readonly<Record<string, EntretienThematique>>;
}

export interface Ppp {
  /** Cellules modifiées par le professionnel ; une cellule absente prend sa valeur par défaut. */
  cellules: Readonly<Record<string, Partial<Record<ColonnePpp, string>>>>;
  modalitesSuivi: string;
  /** Le patient s'oppose à la transmission du PPP au médecin traitant. */
  opposition: boolean;
}

export interface Session {
  ouverture: Ouverture;
  autoquestionnaire: { reponses: ReponsesAQ; precisions: Readonly<Record<string, string>> };
  fiche: Fiche;
  tests: TestsSaisis;
  decision: DecisionPartagee;
  ppp: Ppp;
  /** Actes facturés en sus du Bilan Prévention (codes de scores.json). */
  actesComplementaires: string[];
  /** Horodatage d'ouverture (ms), pour le minuteur d'entretien. */
  debut: number;
}

export function creerSession(ouverture: Ouverture, debut = 0): Session {
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
    decision: { priorites: [], entretiens: {} },
    ppp: { cellules: {}, modalitesSuivi: '', opposition: false },
    actesComplementaires: [],
    debut,
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
  | { type: 'acquitter'; alerte: string }
  | { type: 'priorite'; thematique: string; choisie: boolean; max: number }
  | { type: 'stade'; thematique: string; stade: string }
  | { type: 'balance'; thematique: string; case: string; texte: string }
  | { type: 'ouvrirBalance'; thematique: string }
  | { type: 'cellulePpp'; thematique: string; colonne: ColonnePpp; texte: string }
  | { type: 'modalitesSuivi'; texte: string }
  | { type: 'opposition'; oppose: boolean }
  | { type: 'acte'; code: string; coche: boolean };

/**
 * Ajoute ou retire une priorité. Au-delà du maximum, la sélection est refusée (M12) :
 * la liste est rendue inchangée et `refus` vaut true.
 */
export function basculerPriorite(
  priorites: readonly string[],
  thematique: string,
  choisie: boolean,
  max: number,
): { priorites: string[]; refus: boolean } {
  if (!choisie) return { priorites: priorites.filter((p) => p !== thematique), refus: false };
  if (priorites.includes(thematique)) return { priorites: [...priorites], refus: false };
  if (priorites.length >= max) return { priorites: [...priorites], refus: true };
  return { priorites: [...priorites, thematique], refus: false };
}

function majEntretien(s: Session, thematique: string, f: (e: EntretienThematique) => EntretienThematique): Session {
  const actuel = s.decision.entretiens[thematique] ?? { balance: {} };
  return { ...s, decision: { ...s.decision, entretiens: { ...s.decision.entretiens, [thematique]: f(actuel) } } };
}

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
    case 'priorite': {
      const r = basculerPriorite(s.decision.priorites, a.thematique, a.choisie, a.max);
      return r.refus ? s : { ...s, decision: { ...s.decision, priorites: r.priorites } };
    }
    case 'stade':
      return majEntretien(s, a.thematique, (e) => ({ ...e, stade: a.stade }));
    case 'balance':
      return majEntretien(s, a.thematique, (e) => ({ ...e, balance: { ...e.balance, [a.case]: a.texte } }));
    case 'ouvrirBalance':
      return majEntretien(s, a.thematique, (e) => ({ ...e, balanceOuverte: true }));
    case 'cellulePpp': {
      const ligne = { ...s.ppp.cellules[a.thematique], [a.colonne]: a.texte };
      return { ...s, ppp: { ...s.ppp, cellules: { ...s.ppp.cellules, [a.thematique]: ligne } } };
    }
    case 'modalitesSuivi':
      return { ...s, ppp: { ...s.ppp, modalitesSuivi: a.texte } };
    case 'opposition':
      return { ...s, ppp: { ...s.ppp, opposition: a.oppose } };
    case 'acte': {
      // Cocher deux actes reste possible : le contrôle de facturation signale l'erreur de façon bloquante (S2).
      const autres = s.actesComplementaires.filter((c) => c !== a.code);
      return { ...s, actesComplementaires: a.coche ? [...autres, a.code] : autres };
    }
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
