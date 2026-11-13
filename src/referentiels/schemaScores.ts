import { z } from 'zod';
import { dateIso, documentSource, referenceSource, verifierRefsSources, versionSemver } from './communs';

const niveau = z.enum(['aucun', 'info', 'orange', 'rouge']);
const genreBiologique = z.enum(['H', 'F']);

/** Résultat attaché à une règle déclenchée. */
const conclusion = z.object({
  niveau,
  message: z.string().min(1),
  aVerifier: z.boolean().optional(),
});

/** Seuil "score <= max" ; max null = sans borne haute (dernier seuil uniquement). */
const seuil = z.object({
  max: z.number().nullable(),
  niveau,
  message: z.string().min(1),
  aVerifier: z.boolean().optional(),
});

/**
 * Contrôle d'une grille de seuils : bornes strictement croissantes, seul le dernier seuil peut être
 * sans borne, et si scoreMax est connu le dernier seuil doit le couvrir exactement
 * (aucun score possible sans interprétation).
 */
function verifierGrille(
  seuils: ReadonlyArray<z.infer<typeof seuil>>,
  scoreMax: number | undefined,
  chemin: (string | number)[],
  ctx: z.RefinementCtx,
): void {
  if (seuils.length === 0) {
    ctx.addIssue({ code: 'custom', path: chemin, message: 'au moins un seuil attendu' });
    return;
  }
  seuils.forEach((s, i) => {
    if (s.max === null && i !== seuils.length - 1) {
      ctx.addIssue({ code: 'custom', path: [...chemin, i, 'max'], message: 'seul le dernier seuil peut être sans borne (null)' });
    }
    const prec = seuils[i - 1];
    if (prec && prec.max !== null && s.max !== null && s.max <= prec.max) {
      ctx.addIssue({ code: 'custom', path: [...chemin, i, 'max'], message: 'les bornes doivent être strictement croissantes' });
    }
  });
  const dernier = seuils.length - 1;
  if (scoreMax !== undefined && seuils[dernier]!.max !== scoreMax) {
    ctx.addIssue({ code: 'custom', path: [...chemin, dernier, 'max'], message: `doit valoir ${scoreMax} (score maximal)` });
  }
}

const option = z.object({ libelle: z.string().min(1), points: z.number().int().min(0) });
const itemAOptions = z.object({ id: z.string().min(1), libelle: z.string().min(1), options: z.array(option).min(2) });
const itemOuiNon = z.object({ id: z.string().min(1), libelle: z.string().min(1) });

const maxPoints = (items: ReadonlyArray<{ options: ReadonlyArray<{ points: number }> }>) =>
  items.reduce((t, it) => t + Math.max(...it.options.map((o) => o.points)), 0);

const schemaFace = z
  .object({
    thematique: z.string().min(1),
    source: referenceSource,
    items: z.array(itemAOptions).min(1),
    seuilsParGenre: z.object({ H: z.array(seuil), F: z.array(seuil) }),
    genreNonRenseigne: z.object({ appliquer: genreBiologique, message: z.string().min(1), origine: z.string().min(1) }),
  })
  .superRefine((f, ctx) => {
    verifierGrille(f.seuilsParGenre.H, maxPoints(f.items), ['seuilsParGenre', 'H'], ctx);
    verifierGrille(f.seuilsParGenre.F, maxPoints(f.items), ['seuilsParGenre', 'F'], ctx);
  });

const schemaFagerstrom = z
  .object({
    thematique: z.string().min(1),
    source: referenceSource,
    items: z
      .array(
        z.object({
          id: z.enum(['cigarettesParJour', 'delaiPremiereCigarette']),
          libelle: z.string().min(1),
          options: z
            .array(option.extend({ min: z.number().int().min(0).optional(), max: z.number().int().min(0).optional() }))
            .min(2),
        }),
      )
      .length(2),
    seuils: z.array(seuil),
  })
  .superRefine((v, ctx) => verifierGrille(v.seuils, maxPoints(v.items), ['seuils'], ctx));

const schemaCast = z
  .object({ thematique: z.string().min(1), source: referenceSource, items: z.array(itemOuiNon).min(1), seuils: z.array(seuil) })
  .superRefine((v, ctx) => verifierGrille(v.seuils, v.items.length, ['seuils'], ctx));

const applicabiliteAge = z.object({ ageMin: z.number().int().min(0), ageMax: z.number().int().min(0).optional() });

const schemaAdrs = z
  .object({ thematique: z.string().min(1), source: referenceSource, applicabilite: applicabiliteAge, items: z.array(itemOuiNon).min(1), seuils: z.array(seuil) })
  .superRefine((v, ctx) => verifierGrille(v.seuils, v.items.length, ['seuils'], ctx));

const schemaHad = z
  .object({
    thematique: z.string().min(1),
    source: referenceSource,
    applicabilite: applicabiliteAge,
    items: z.array(itemAOptions.extend({ dimension: z.string().min(1) })).min(2),
    dimensions: z.array(z.object({ id: z.string().min(1), libelle: z.string().min(1) })).min(1),
    seuils: z.array(seuil),
    complement: z.string().min(1),
  })
  .superRefine((v, ctx) => {
    const ids = new Set(v.dimensions.map((d) => d.id));
    v.items.forEach((it, i) => {
      if (!ids.has(it.dimension)) {
        ctx.addIssue({ code: 'custom', path: ['items', i, 'dimension'], message: `dimension "${it.dimension}" inconnue` });
      }
    });
    // Toutes les dimensions partagent la grille : elle doit couvrir le score maximal de chacune.
    const maxParDimension = v.dimensions.map((d) => maxPoints(v.items.filter((i) => i.dimension === d.id)));
    if (new Set(maxParDimension).size > 1) {
      ctx.addIssue({ code: 'custom', path: ['dimensions'], message: 'les dimensions doivent avoir le même score maximal' });
    }
    verifierGrille(v.seuils, maxParDimension[0], ['seuils'], ctx);
  });

const thematique = z.string().min(1);

export const schemaScores = z
  .object({
    version: versionSemver,
    dateValidation: dateIso.nullable(),
    sources: z.array(documentSource).min(1),
    thematiques: z.object({
      source: referenceSource,
      items: z.array(z.object({ id: z.string().min(1), libelle: z.string().min(1), pageFiche: z.number().int().positive() })).min(1),
    }),
    imc: z.object({
      thematique,
      source: referenceSource,
      decimales: z.number().int().min(0).max(3),
      seuils: z.array(seuil),
      noteAVerifier: z.string().optional(),
    }).superRefine((v, ctx) => verifierGrille(v.seuils, undefined, ['seuils'], ctx)),
    pressionArterielle: z.object({
      thematique,
      source: referenceSource,
      mesuresMin: z.number().int().min(1),
      seuils: z
        .array(
          z.object({
            systolique: z.number().positive(),
            diastolique: z.number().positive(),
            niveau,
            bloquant: z.boolean(),
            message: z.string().min(1),
          }),
        )
        .min(1)
        .refine((s) => s.every((x, i) => i === 0 || x.systolique < s[i - 1]!.systolique), {
          message: 'seuils à classer du plus sévère au moins sévère',
        }),
    }),
    reperesAlcool: z.object({
      thematique,
      source: referenceSource,
      reperes: z.array(itemOuiNon).min(1),
      siDepasse: conclusion,
    }),
    face: schemaFace,
    fagerstrom: schemaFagerstrom,
    cast: schemaCast,
    adrs: schemaAdrs,
    had: schemaHad,
    icope: z.object({
      thematique,
      source: referenceSource,
      motsARetenir: z.array(z.string().min(1)).min(1),
      questionsOrientation: z.array(z.string().min(1)).min(1),
      domaines: z
        .array(
          z.object({
            id: z.enum(['cognition', 'nutrition', 'vision', 'audition', 'psychologie', 'mobilite']),
            libelle: z.string().min(1),
            critere: z.string().min(1),
            aVerifier: z.boolean(),
          }),
        )
        .length(6),
      mobiliteSecondesMax: z.number().positive(),
      siPositif: conclusion,
      noteAVerifier: z.string().optional(),
    }),
    amsler: z.object({ thematique, source: referenceSource, siAnormal: conclusion }),
    polymedication: z.object({
      thematique,
      source: referenceSource,
      nombreTraitementsMax: z.number().int().min(0),
      siDepasse: conclusion,
    }),
    ideesSuicidaires: z.object({
      source: referenceSource,
      siCoche: conclusion.extend({ thematique: z.string().min(1) }),
    }),
    medecinTraitant: z.object({ thematique, source: referenceSource, siAbsent: conclusion }),
    depistages: z.object({
      thematique,
      source: referenceSource,
      sourceLibelles: referenceSource,
      organises: z
        .array(
          z
            .object({
              id: z.string().min(1),
              genres: z.array(genreBiologique).min(1),
              ageMin: z.number().int().min(0),
              ageMax: z.number().int().min(0),
              libelle: z.string().min(1),
              modalite: z.string().min(1),
            })
            .refine((d) => d.ageMin <= d.ageMax, { message: 'ageMax doit être supérieur ou égal à ageMin', path: ['ageMax'] }),
        )
        .min(1),
      risqueEleve: z.array(
        z.object({ id: z.string().min(1), genres: z.array(genreBiologique).min(1), libelle: z.string().min(1), modalite: z.string().min(1) }),
      ),
      genreNonRenseigne: z.string().min(1),
    }),
    facturation: z.object({
      source: referenceSource,
      acteBilan: z.object({ code: z.string().min(1), libelle: z.string().min(1), montantEuros: z.number().positive(), rappel: z.string().min(1) }),
      actesComplementaires: z.array(z.object({ code: z.string().min(1), libelle: z.string().min(1) })).min(1),
      maxActesComplementaires: z.number().int().min(0),
      messageDepassement: z.string().min(1),
    }),
  })
  .strict()
  .superRefine((s, ctx) => {
    const refs: Array<[string, (string | number)[]]> = [];
    for (const [cle, bloc] of Object.entries(s)) {
      if (bloc && typeof bloc === 'object' && 'source' in bloc) {
        refs.push([(bloc as { source: { ref: string } }).source.ref, [cle, 'source', 'ref']]);
      }
    }
    refs.push([s.depistages.sourceLibelles.ref, ['depistages', 'sourceLibelles', 'ref']]);
    verifierRefsSources(s.sources, refs, ctx);
    // Toute thématique citée par une règle doit exister dans la liste des fiches thématiques.
    const ids = new Set(s.thematiques.items.map((t) => t.id));
    for (const [cle, bloc] of Object.entries(s)) {
      const th = bloc && typeof bloc === 'object' && 'thematique' in bloc ? (bloc as { thematique: string }).thematique : null;
      if (th && !ids.has(th)) ctx.addIssue({ code: 'custom', path: [cle, 'thematique'], message: `thématique "${th}" inconnue` });
    }
    if (!ids.has(s.ideesSuicidaires.siCoche.thematique)) {
      ctx.addIssue({ code: 'custom', path: ['ideesSuicidaires', 'siCoche', 'thematique'], message: 'thématique inconnue' });
    }
  });

export type ReferentielScores = z.infer<typeof schemaScores>;
export type Niveau = z.infer<typeof niveau>;
export type Seuil = z.infer<typeof seuil>;
export type Conclusion = z.infer<typeof conclusion>;
