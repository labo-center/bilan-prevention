import { z } from 'zod';
import { referenceSource } from './communs';

const id = z.string().regex(/^[A-Za-z0-9-]+$/, 'identifiant alphanumérique attendu');

const optionQuestion = z.object({
  id,
  libelle: z.string().min(1),
  /** Ajoute une zone de texte libre à l'option (ex. « Autre(s) maladie(s) : »). */
  precision: z.boolean().optional(),
  /** Option incompatible avec les autres (ex. « Aucune ») dans une question à choix multiples. */
  exclusive: z.boolean().optional(),
});

const baseQuestion = {
  id,
  libelle: z.string().min(1),
  aide: z.string().min(1).optional(),
  afficherSi: z.object({ question: id, valeurs: z.array(id).min(1) }).optional(),
};

const question = z.discriminatedUnion('type', [
  z.object({ ...baseQuestion, type: z.literal('unique'), options: z.array(optionQuestion).min(2) }).strict(),
  z.object({ ...baseQuestion, type: z.literal('multiple'), options: z.array(optionQuestion).min(1) }).strict(),
  z
    .object({ ...baseQuestion, type: z.literal('nombre'), unite: z.string().min(1), min: z.number(), max: z.number(), pas: z.number().positive() })
    .strict(),
  z.object({ ...baseQuestion, type: z.literal('texte') }).strict(),
]);

export const schemaAutoquestionnaire = z.object({
  source: referenceSource,
  introduction: z.string().min(1),
  sections: z.array(z.object({ id, titre: z.string().min(1), questions: z.array(question).min(1) })).min(1),
});

const baseChamp = {
  id,
  libelle: z.string().min(1),
  aide: z.string().min(1).optional(),
  /** Zone de texte complémentaire (ex. « Si oui, lesquels »). */
  precision: z.string().min(1).optional(),
  /** Une valeur renseignée correspond à un risque repéré (matrice des risques). */
  risque: z.boolean().optional(),
  /** Thématique propre au champ, sinon celle de la section. */
  thematique: id.optional(),
  /** Questions de l'autoquestionnaire dont les réponses sont rappelées à côté du champ. */
  reponsesAssociees: z.array(id).min(1).optional(),
  /** Champ absent de la fiche officielle, ajouté par l'outil (motif dans `aide`) ; signalé à l'écran. */
  horsFicheOfficielle: z.boolean().optional(),
};

const champ = z.discriminatedUnion('type', [
  z.object({ ...baseChamp, type: z.literal('case') }).strict(),
  z.object({ ...baseChamp, type: z.literal('ouiNon') }).strict(),
  z.object({ ...baseChamp, type: z.literal('texte'), multiligne: z.boolean().optional() }).strict(),
  z
    .object({
      ...baseChamp,
      type: z.literal('nombre'),
      unite: z.string().min(1).optional(),
      min: z.number(),
      max: z.number(),
      pas: z.number().positive(),
      /** Champ d'aide au calcul, absent de la fiche officielle (non imprimé tel quel). */
      aideCalcul: z.boolean().optional(),
    })
    .strict(),
  z.object({ ...baseChamp, type: z.literal('choix'), options: z.array(z.object({ id, libelle: z.string().min(1) })).min(2) }).strict(),
  z
    .object({
      ...baseChamp,
      type: z.literal('calcule'),
      lien: z.enum(['session.dateRdv', 'session.age', 'session.genre', 'tests.pa', 'tests.had', 'tests.face', 'tests.fagerstrom', 'tests.cast', 'tests.amsler']),
    })
    .strict(),
]);

export const schemaFiche = z.object({
  source: referenceSource,
  sections: z
    .array(z.object({ id, titre: z.string().min(1), thematique: id.optional(), champs: z.array(champ).min(1) }).strict())
    .min(1),
});

/** Rôles des champs de la fiche utilisés par les règles de logic/. */
export const schemaLiaisons = z
  .object({
    taille: id,
    poids: id,
    medecinTraitant: id,
    nombreTraitements: id,
    polymedication: id,
    ideesSuicidaires: id,
    risqueEleveColorectal: id,
    risqueEleveSein: id,
    /** Question de l'autoquestionnaire dont les options portent les repères alcool de scores.json. */
    questionReperesAlcool: id,
  })
  .strict();

const regleMapping = z.union([
  z.object({ question: id, champ: id, copier: z.literal(true) }).strict(),
  z
    .object({
      question: id,
      siReponse: z.array(id).min(1),
      champ: id,
      valeur: z.union([z.boolean(), z.string().min(1)]),
      aVerifier: z.boolean().optional(),
    })
    .strict(),
]);

export const schemaMapping = z.object({ source: referenceSource, regles: z.array(regleMapping) });

/** Conseils patient de l'autoquestionnaire, proposés en suggestion dans le PPP. */
export const schemaConseilsPatient = z.object({
  source: referenceSource,
  items: z.array(z.object({ thematique: id, titre: z.string().min(1), texte: z.string().min(1) }).strict()).min(1),
});

/** Correspondance entre les sujets que le patient souhaite aborder (Q46) et les thématiques. */
export const schemaSouhaitsPatient = z.object({
  question: id,
  source: referenceSource,
  correspondances: z.array(z.object({ option: id, thematiques: z.array(id).min(1) }).strict()).min(1),
});

export type Question = z.infer<typeof question>;
export type Champ = z.infer<typeof champ>;
export type RegleMapping = z.infer<typeof regleMapping>;

/** Type attendu par un rôle de liaison. */
const TYPE_LIAISON: Record<Exclude<keyof z.infer<typeof schemaLiaisons>, 'questionReperesAlcool'>, Champ['type']> = {
  taille: 'nombre',
  poids: 'nombre',
  medecinTraitant: 'ouiNon',
  nombreTraitements: 'nombre',
  polymedication: 'case',
  ideesSuicidaires: 'case',
  risqueEleveColorectal: 'case',
  risqueEleveSein: 'case',
};

/** Contrôles croisés : identifiants uniques, références existantes, valeurs compatibles avec le type du champ. */
export function verifierCoherenceSaisie(
  ref: {
    autoquestionnaire: z.infer<typeof schemaAutoquestionnaire>;
    ficheReperage: z.infer<typeof schemaFiche>;
    liaisons: z.infer<typeof schemaLiaisons>;
    mapping: z.infer<typeof schemaMapping>;
    souhaitsPatient: z.infer<typeof schemaSouhaitsPatient>;
  },
  ctx: z.RefinementCtx,
): void {
  const questions = new Map<string, Question>();
  ref.autoquestionnaire.sections.forEach((s, i) =>
    s.questions.forEach((q, j) => {
      if (questions.has(q.id)) {
        ctx.addIssue({ code: 'custom', path: ['autoquestionnaire', 'sections', i, 'questions', j, 'id'], message: `question "${q.id}" en double` });
      }
      questions.set(q.id, q);
    }),
  );
  ref.autoquestionnaire.sections.forEach((s, i) =>
    s.questions.forEach((q, j) => {
      if (!q.afficherSi) return;
      const cible = questions.get(q.afficherSi.question);
      const ids = cible && 'options' in cible ? cible.options.map((o) => o.id) : [];
      for (const v of q.afficherSi.valeurs) {
        if (!ids.includes(v)) {
          ctx.addIssue({
            code: 'custom',
            path: ['autoquestionnaire', 'sections', i, 'questions', j, 'afficherSi'],
            message: `réponse "${q.afficherSi.question}=${v}" inexistante`,
          });
        }
      }
    }),
  );

  const champs = new Map<string, Champ>();
  ref.ficheReperage.sections.forEach((s, i) =>
    s.champs.forEach((c, j) => {
      if (champs.has(c.id)) {
        ctx.addIssue({ code: 'custom', path: ['ficheReperage', 'sections', i, 'champs', j, 'id'], message: `champ "${c.id}" en double` });
      }
      champs.set(c.id, c);
    }),
  );

  ref.ficheReperage.sections.forEach((s, i) =>
    s.champs.forEach((c, j) => {
      if (c.horsFicheOfficielle && !c.aide) {
        ctx.addIssue({ code: 'custom', path: ['ficheReperage', 'sections', i, 'champs', j, 'aide'], message: 'motif obligatoire pour un champ hors fiche officielle' });
      }
      for (const q of c.reponsesAssociees ?? []) {
        if (!questions.has(q)) {
          ctx.addIssue({ code: 'custom', path: ['ficheReperage', 'sections', i, 'champs', j, 'reponsesAssociees'], message: `question "${q}" inexistante` });
        }
      }
    }),
  );

  const qSouhaits = questions.get(ref.souhaitsPatient.question);
  const optionsSouhaits = qSouhaits && 'options' in qSouhaits ? qSouhaits.options.map((o) => o.id) : null;
  if (!optionsSouhaits) ctx.addIssue({ code: 'custom', path: ['souhaitsPatient', 'question'], message: 'question à choix attendue' });
  ref.souhaitsPatient.correspondances.forEach((c, i) => {
    if (optionsSouhaits && !optionsSouhaits.includes(c.option)) {
      ctx.addIssue({ code: 'custom', path: ['souhaitsPatient', 'correspondances', i, 'option'], message: `option "${c.option}" inexistante` });
    }
  });

  const qAlcool = questions.get(ref.liaisons.questionReperesAlcool);
  if (!qAlcool || qAlcool.type !== 'multiple') {
    ctx.addIssue({ code: 'custom', path: ['liaisons', 'questionReperesAlcool'], message: 'question à choix multiples attendue' });
  }

  for (const [role, champId] of Object.entries(ref.liaisons).filter(([r]) => r !== 'questionReperesAlcool') as Array<
    [keyof typeof TYPE_LIAISON, string]
  >) {
    const c = champs.get(champId);
    if (!c) ctx.addIssue({ code: 'custom', path: ['liaisons', role], message: `champ "${champId}" absent de la fiche` });
    else if (c.type !== TYPE_LIAISON[role]) {
      ctx.addIssue({ code: 'custom', path: ['liaisons', role], message: `le champ "${champId}" doit être de type ${TYPE_LIAISON[role]}` });
    }
  }

  ref.mapping.regles.forEach((r, i) => {
    const chemin = ['mapping', 'regles', i];
    const q = questions.get(r.question);
    const c = champs.get(r.champ);
    if (!q) ctx.addIssue({ code: 'custom', path: [...chemin, 'question'], message: `question "${r.question}" inexistante` });
    if (!c) ctx.addIssue({ code: 'custom', path: [...chemin, 'champ'], message: `champ "${r.champ}" inexistant` });
    if (!q || !c) return;
    if ('copier' in r) {
      if (q.type !== 'nombre' || c.type !== 'nombre') {
        ctx.addIssue({ code: 'custom', path: chemin, message: 'copie possible uniquement d’une question nombre vers un champ nombre' });
      }
      return;
    }
    const options = 'options' in q ? q.options.map((o) => o.id) : [];
    for (const v of r.siReponse) {
      if (!options.includes(v)) ctx.addIssue({ code: 'custom', path: [...chemin, 'siReponse'], message: `réponse "${v}" inexistante pour ${q.id}` });
    }
    const ok =
      (c.type === 'case' && r.valeur === true) ||
      (c.type === 'ouiNon' && (r.valeur === 'oui' || r.valeur === 'non')) ||
      (c.type === 'choix' && c.options.some((o) => o.id === r.valeur)) ||
      (c.type === 'texte' && typeof r.valeur === 'string');
    if (!ok) ctx.addIssue({ code: 'custom', path: [...chemin, 'valeur'], message: `valeur incompatible avec le champ ${c.type} "${c.id}"` });
  });
}
