import { z } from 'zod';

/** Référence vers un passage d'un document officiel de docs/sources/. */
const referenceSource = z.object({
  ref: z.string().min(1),
  page: z.string().min(1),
  extrait: z.string().min(1),
});

const documentSource = z.object({
  id: z.string().min(1),
  document: z.string().min(1),
  fichier: z.string().regex(/^docs\/sources\/.+\.pdf$/, 'doit pointer vers un PDF de docs/sources/'),
});

const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format attendu AAAA-MM-JJ');

export const schemaReferentielTranche = z
  .object({
    version: z.string().regex(/^\d+\.\d+\.\d+$/, 'version semver attendue (x.y.z)'),
    /** null tant que le pharmacien référent n'a pas validé cette version (HYP5). */
    dateValidation: dateIso.nullable(),
    sources: z.array(documentSource).min(1),
    tranche: z.object({
      id: z.string().regex(/^\d{2}-\d{2}$/, 'identifiant attendu "AA-AA"'),
      libelle: z.string().min(1),
      ageMin: z.number().int().min(0),
      ageMax: z.number().int().min(0),
      bornesIncluses: z.literal(true),
      source: referenceSource,
    }),
    ouvertureSession: z.object({
      genres: z
        .array(z.object({ id: z.string().min(1), libelle: z.string().min(1) }))
        .min(1),
      source: referenceSource,
    }),
    testsApplicables: z.object({
      source: referenceSource,
      items: z
        .array(
          z.object({
            id: z.string().min(1),
            libelle: z.string().min(1),
            aVerifier: z.boolean().optional(),
          }),
        )
        .min(1),
    }),
  })
  .strict()
  .superRefine((ref, ctx) => {
    if (ref.tranche.ageMin > ref.tranche.ageMax) {
      ctx.addIssue({ code: 'custom', path: ['tranche', 'ageMax'], message: 'ageMax doit être supérieur ou égal à ageMin' });
    }
    if (ref.tranche.id !== `${ref.tranche.ageMin}-${ref.tranche.ageMax}`) {
      ctx.addIssue({ code: 'custom', path: ['tranche', 'id'], message: 'doit correspondre à "ageMin-ageMax"' });
    }
    const idsSources = new Set(ref.sources.map((s) => s.id));
    const refs: Array<[string, (string | number)[]]> = [
      [ref.tranche.source.ref, ['tranche', 'source', 'ref']],
      [ref.ouvertureSession.source.ref, ['ouvertureSession', 'source', 'ref']],
      [ref.testsApplicables.source.ref, ['testsApplicables', 'source', 'ref']],
    ];
    for (const [id, path] of refs) {
      if (!idsSources.has(id)) ctx.addIssue({ code: 'custom', path, message: `source "${id}" absente de "sources"` });
    }
  });

export type ReferentielTranche = z.infer<typeof schemaReferentielTranche>;
