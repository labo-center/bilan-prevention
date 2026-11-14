import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { calculerAge } from '../age';
import { nombreFr } from '../document';
import { evaluerSession, type EvaluationSession } from '../evaluation';
import { pointsCigarettesParJour } from '../fagerstrom';
import type { SaisieIcope } from '../icope';
import { creerSession, reduireSession, type Action, type Session } from '../session';
import { selectionnerTranche } from '../tranche';
import type { ReferentielScores } from '../../referentiels/schemaScores';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels } from '../../referentiels/__tests__/fixtures';

/**
 * Rejeu des 20 cas complets de non-régression (PRD §8) : chaque résultat attendu, établi à partir
 * du livret, doit être retrouvé à l'identique par l'outil, en passant par la saisie complète
 * (questionnaire, fiche, tests). Écart toléré : 0. Le calcul règle par règle est vérifié de façon
 * exhaustive par oracle.test.ts ; le pharmacien valide les règles (docs/validation/dossier-validation.md).
 */

interface Cas {
  id: string;
  tranche: string;
  objet: string;
  ouverture: { dateNaissance: string; genre: string };
  autoquestionnaire?: Record<string, string | string[] | number>;
  fiche?: Record<string, boolean | string | number>;
  mesures?: { tailleM?: number; poidsKg?: number; pa?: Array<['gauche' | 'droit', number, number]> };
  questionnaires?: {
    face?: Record<string, number>;
    fagerstrom?: { cigarettesParJour: number; delai: string };
    cast?: boolean[];
    adrs?: boolean[];
    had?: number[];
    amsler?: 'normal' | 'anormal';
    icope?: SaisieIcope;
  };
  attendu: Record<string, unknown>;
}

const fichier = JSON.parse(readFileSync(resolve(import.meta.dirname, '../../../validation/cas-tests.json'), 'utf8')) as { dateRdv: string; cas: Cas[] };
const chargement = chargerReferentiels(lireReferentielsReels());
if (!chargement.ok) throw new Error('référentiels invalides');
const { tranches, scores } = chargement;

/** Traduit les entrées d'un cas en actions de session, comme le ferait la saisie à l'écran. */
function actions(c: Cas, s: ReferentielScores): Action[] {
  const a: Action[] = [];
  for (const [question, valeur] of Object.entries(c.autoquestionnaire ?? {})) a.push({ type: 'repondre', question, valeur });
  for (const [champ, valeur] of Object.entries(c.fiche ?? {})) a.push({ type: 'champ', champ, valeur });
  const m = c.mesures ?? {};
  if (m.tailleM !== undefined) a.push({ type: 'champ', champ: 'taille', valeur: m.tailleM });
  if (m.poidsKg !== undefined) a.push({ type: 'champ', champ: 'poids', valeur: m.poidsKg });
  if (m.pa) a.push({ type: 'pa', lignes: m.pa.map(([bras, systolique, diastolique]) => ({ bras, systolique, diastolique })) });
  const q = c.questionnaires ?? {};
  for (const [item, points] of Object.entries(q.face ?? {})) a.push({ type: 'face', item, points });
  if (q.fagerstrom) {
    const delai = s.fagerstrom.items[1]!.options.find((o) => o.libelle === q.fagerstrom!.delai);
    if (!delai) throw new Error(`${c.id} : délai « ${q.fagerstrom.delai} » inconnu`);
    a.push({ type: 'fagerstrom', item: 'cigarettesParJour', points: pointsCigarettesParJour(q.fagerstrom.cigarettesParJour, s.fagerstrom) ?? undefined });
    a.push({ type: 'fagerstrom', item: 'delaiPremiereCigarette', points: delai.points });
  }
  q.cast?.forEach((oui, i) => a.push({ type: 'cast', item: `q${i + 1}`, oui }));
  q.adrs?.forEach((oui, i) => a.push({ type: 'adrs', item: `q${i + 1}`, oui }));
  q.had?.forEach((points, i) => a.push({ type: 'had', item: `q${i + 1}`, points }));
  if (q.amsler) a.push({ type: 'amsler', anormal: q.amsler === 'anormal' });
  if (q.icope) a.push({ type: 'icope', saisie: q.icope });
  return a;
}

/** Résultats de l'outil, mis au même format que les résultats attendus du fichier de cas. */
function resume(session: Session, ev: EvaluationSession, themeTranche: string): Record<string, unknown> {
  const score = (r: { complet: boolean } | null) => (r && 'score' in r && 'interpretation' in r ? `${r.score} - ${(r.interpretation as { message: string }).message}` : null);
  const had = (d: string) => score(ev.had.find((x) => x.dimension === d) ?? null);
  return {
    age: session.ouverture.age,
    trancheId: session.ouverture.trancheId,
    theme: themeTranche,
    echelles: ev.testsProposes.filter((t) => ['adrs', 'had', 'amsler', 'icope'].includes(t)).sort(),
    imc: ev.imc.calculable ? `${ev.imc.imc.toFixed(1).replace('.', ',')} - ${ev.imc.interpretation.message}` : 'non calculable',
    pa: ev.pa.complet
      ? `${nombreFr(ev.pa.retenue.systolique)}/${nombreFr(ev.pa.retenue.diastolique)} - ${ev.pa.niveau === 'aucun' ? 'aucune orientation' : ev.pa.niveau}${ev.pa.bloquant ? ' bloquante' : ''}`
      : 'incomplète',
    face: score(ev.face),
    faceSeuilsFemmesParDefaut: ev.face.complet ? ev.face.avertissementGenre !== null : null,
    fagerstrom: score(ev.fagerstrom),
    cast: score(ev.cast),
    adrs: score(ev.adrs),
    hadA: had('A'),
    hadD: had('D'),
    icopePositifs: ev.icope?.domaines.filter((d) => d.statut === 'positif').map((d) => d.libelle) ?? null,
    reperesAlcool: ev.reperesAlcool !== null,
    polymedication: ev.polymedication !== null,
    medecinTraitantAbsent: ev.medecinTraitant !== null,
    depistages: ev.depistages.map((d) => (d.type === 'risque-eleve' ? `RE:${d.id}` : d.siConcerne ? `${d.id} (si concerné)` : d.id)),
    alertesRouges: ev.risques.filter((r) => r.niveau === 'rouge').map((r) => r.id).sort(),
    ficheDeclaree: Object.entries(session.fiche)
      .filter(([, e]) => e.origine === 'declare_patient' && e.valeur !== false && e.valeur !== undefined && e.valeur !== '')
      .map(([id]) => id)
      .sort(),
  };
}

describe('Dossier de validation à jour', () => {
  it('le dossier relu par le pharmacien reflète les référentiels en vigueur', () => {
    expect(() => execFileSync('node', [resolve(import.meta.dirname, '../../../scripts/dossier-validation.mjs'), '--verifier'], { stdio: 'pipe' })).not.toThrow();
  });
});

describe('Validation : 20 cas complets de non-régression (PRD §8)', () => {
  it('20 cas, au moins 5 par tranche', () => {
    expect(fichier.cas).toHaveLength(20);
    for (const t of tranches) expect(fichier.cas.filter((c) => c.tranche === t.tranche.id).length, t.tranche.id).toBeGreaterThanOrEqual(5);
  });

  describe.each(fichier.cas.map((c) => [`${c.id} (${c.tranche}) : ${c.objet}`, c] as const))('%s', (_, c) => {
    const age = calculerAge(c.ouverture.dateNaissance, fichier.dateRdv);
    if (!age.ok) throw new Error(`${c.id} : date invalide`);
    const tranche = selectionnerTranche(age.age, tranches.map((t) => t.tranche));
    const ref = tranches.find((t) => t.tranche.id === tranche?.id);

    it('âge et tranche', () => {
      expect(age.age).toBe(c.attendu.age);
      expect(ref?.tranche.id).toBe(c.tranche);
    });

    const session = actions(c, scores).reduce(
      (s, a) => reduireSession(s, a, ref!.mapping.regles),
      creerSession({ dateRdv: fichier.dateRdv, dateNaissance: c.ouverture.dateNaissance, genre: c.ouverture.genre, age: age.age, trancheId: c.tranche }),
    );
    const obtenu = resume(session, evaluerSession(session, ref!, scores), ref!.affichage?.themeRecommande ?? 'clair');

    for (const [cle, attendu] of Object.entries(c.attendu)) {
      it(cle, () => expect(Array.isArray(attendu) && cle === 'echelles' ? [...attendu].sort() : attendu).toEqual(obtenu[cle]));
    }
  });
});
