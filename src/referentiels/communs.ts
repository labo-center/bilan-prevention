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
