import { z } from 'zod';
import { dateIso, documentSource, referenceSource, verifierRefsSources, versionSemver } from './communs';

const ressource = z.object({ categorie: z.string().min(1), libelle: z.string().min(1) }).strict();

export const schemaOrientation = z
  .object({
    version: versionSemver,
    dateValidation: dateIso.nullable(),
    sources: z.array(documentSource).min(1),
    effecteur: z.literal('pharmacien'),
    kit: z.object({
      source: referenceSource,
      avertissement: z.string().min(1),
      thematiques: z
        .array(
          z
            .object({
              thematique: z.string().min(1),
              libelleKit: z.string().min(1),
              source: referenceSource,
              ressources: z.object({ pharmacien: z.array(ressource).min(1) }),
            })
            .strict(),
        )
        .min(1),
    }),
    ajoutsDOffice: z.array(
      z
        .object({
          /** Règle de scores.json qui déclenche l'ajout (seule « ideesSuicidaires » est câblée en v1). */
          regle: z.enum(['ideesSuicidaires']),
          thematique: z.string().min(1),
          motif: z.string().min(1),
          source: referenceSource,
          origine: z.string().min(1),
        })
        .strict(),
    ),
    decisionPartagee: z.object({
      source: referenceSource,
      prioritesMax: z.number().int().min(1),
      consigne: z.string().min(1),
    }),
    entretienMotivationnel: z.object({
      source: referenceSource,
      sourceStades: referenceSource,
      stades: z.array(z.object({ id: z.string().min(1), libelle: z.string().min(1), description: z.string().min(1) }).strict()).min(1),
      balance: z.object({
        source: referenceSource,
        stadesRecommandes: z.array(z.string().min(1)),
        cases: z.array(z.object({ id: z.string().min(1), libelle: z.string().min(1) }).strict()).length(4),
        consignes: z.array(z.string().min(1)).min(1),
      }),
      questionsParThematique: z.array(
        z
          .object({ thematique: z.string().min(1), titre: z.string().min(1), source: referenceSource, questions: z.array(z.string().min(1)).min(1) })
          .strict(),
      ),
    }),
    ppp: z.object({
      source: referenceSource,
      titre: z.string().min(1),
      sousTitre: z.string().min(1),
      colonnes: z
        .array(z.object({ id: z.enum(['priorite', 'freins', 'conseils', 'ressources']), libelle: z.string().min(1), note: z.string().min(1).optional() }).strict())
        .length(4),
      modalitesSuivi: z.string().min(1),
      encouragement: z.string().min(1),
      opposition: z.string().min(1),
      freinsSuggeres: z.object({ source: referenceSource, items: z.array(z.string().min(1)).min(1) }),
    }),
  })
  .strict()
  .superRefine((o, ctx) => {
    const refs: Array<[string, (string | number)[]]> = [
      [o.kit.source.ref, ['kit', 'source', 'ref']],
      [o.decisionPartagee.source.ref, ['decisionPartagee', 'source', 'ref']],
      [o.entretienMotivationnel.source.ref, ['entretienMotivationnel', 'source', 'ref']],
      [o.entretienMotivationnel.sourceStades.ref, ['entretienMotivationnel', 'sourceStades', 'ref']],
      [o.entretienMotivationnel.balance.source.ref, ['entretienMotivationnel', 'balance', 'source', 'ref']],
      [o.ppp.source.ref, ['ppp', 'source', 'ref']],
      [o.ppp.freinsSuggeres.source.ref, ['ppp', 'freinsSuggeres', 'source', 'ref']],
      ...o.kit.thematiques.map((t, i): [string, (string | number)[]] => [t.source.ref, ['kit', 'thematiques', i, 'source', 'ref']]),
      ...o.ajoutsDOffice.map((a, i): [string, (string | number)[]] => [a.source.ref, ['ajoutsDOffice', i, 'source', 'ref']]),
      ...o.entretienMotivationnel.questionsParThematique.map((q, i): [string, (string | number)[]] => [q.source.ref, ['entretienMotivationnel', 'questionsParThematique', i, 'source', 'ref']]),
    ];
    verifierRefsSources(o.sources, refs, ctx);

    const vus = new Set<string>();
    o.kit.thematiques.forEach((t, i) => {
      if (vus.has(t.thematique)) ctx.addIssue({ code: 'custom', path: ['kit', 'thematiques', i, 'thematique'], message: `thématique "${t.thematique}" en double` });
      vus.add(t.thematique);
    });
    const stades = new Set(o.entretienMotivationnel.stades.map((s) => s.id));
    o.entretienMotivationnel.balance.stadesRecommandes.forEach((s, i) => {
      if (!stades.has(s)) ctx.addIssue({ code: 'custom', path: ['entretienMotivationnel', 'balance', 'stadesRecommandes', i], message: `stade "${s}" inconnu` });
    });
  });

export type ReferentielOrientation = z.infer<typeof schemaOrientation>;

/** Toutes les thématiques citées par orientation.json, avec leur chemin (contrôle croisé avec scores.json). */
export function thematiquesCitees(o: ReferentielOrientation): Array<[string, string]> {
  return [
    ...o.kit.thematiques.map((t, i): [string, string] => [t.thematique, `kit.thematiques[${i}].thematique`]),
    ...o.ajoutsDOffice.map((a, i): [string, string] => [a.thematique, `ajoutsDOffice[${i}].thematique`]),
    ...o.entretienMotivationnel.questionsParThematique.map((q, i): [string, string] => [q.thematique, `entretienMotivationnel.questionsParThematique[${i}].thematique`]),
  ];
}
