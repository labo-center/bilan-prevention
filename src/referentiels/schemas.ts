import { z } from 'zod';
import { dateIso, documentSource, referenceSource, verifierRefsSources, versionSemver } from './communs';
import {
  schemaAutoquestionnaire, schemaConseilsPatient, schemaFiche, schemaLiaisons, schemaMapping, schemaSouhaitsPatient, verifierCoherenceSaisie,
} from './schemaSaisie';

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
    autoquestionnaire: schemaAutoquestionnaire,
    ficheReperage: schemaFiche,
    liaisons: schemaLiaisons,
    mapping: schemaMapping,
    conseilsPatient: schemaConseilsPatient,
    souhaitsPatient: schemaSouhaitsPatient,
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
        [ref.autoquestionnaire.source.ref, ['autoquestionnaire', 'source', 'ref']],
        [ref.ficheReperage.source.ref, ['ficheReperage', 'source', 'ref']],
        [ref.mapping.source.ref, ['mapping', 'source', 'ref']],
        [ref.conseilsPatient.source.ref, ['conseilsPatient', 'source', 'ref']],
        [ref.souhaitsPatient.source.ref, ['souhaitsPatient', 'source', 'ref']],
      ],
      ctx,
    );
    verifierCoherenceSaisie(ref, ctx);
  });

export type ReferentielTranche = z.infer<typeof schemaReferentielTranche>;
