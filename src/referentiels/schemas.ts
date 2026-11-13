import { z } from 'zod';

/** Référence vers un passage d'un document officiel de docs/sources/. */
export const referenceSource = z.object({
  ref: z.string().min(1),
  page: z.string().min(1),
  extrait: z.string().min(1),
});

export const documentSource = z.object({
  id: z.string().min(1),
  document: z.string().min(1),
  fichier: z.string().regex(/^docs\/sources\/.+\.pdf$/, 'doit pointer vers un PDF de docs/sources/'),
});

export const dateIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'format attendu AAAA-MM-JJ');

export const versionSemver = z.string().regex(/^\d+\.\d+\.\d+$/, 'version semver attendue (x.y.z)');

/** Vérifie que chaque "ref" de source pointe vers une entrée du tableau "sources". */
export function verifierRefsSources(
  sources: ReadonlyArray<{ id: string }>,
  refs: ReadonlyArray<[string, (string | number)[]]>,
  ctx: z.RefinementCtx,
): void {
  const ids = new Set(sources.map((s) => s.id));
  for (const [id, path] of refs) {
    if (!ids.has(id)) ctx.addIssue({ code: 'custom', path, message: `source "${id}" absente de "sources"` });
  }
}

export const schemaReferentielTranche = z
  .object({
    version: versionSemver,
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
    verifierRefsSources(
      ref.sources,
      [
        [ref.tranche.source.ref, ['tranche', 'source', 'ref']],
        [ref.ouvertureSession.source.ref, ['ouvertureSession', 'source', 'ref']],
        [ref.testsApplicables.source.ref, ['testsApplicables', 'source', 'ref']],
      ],
      ctx,
    );
  });

export type ReferentielTranche = z.infer<typeof schemaReferentielTranche>;
