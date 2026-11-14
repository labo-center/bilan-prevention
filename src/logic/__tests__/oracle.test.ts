import { describe, expect, it } from 'vitest';
import { calculerAdrs } from '../adrs';
import { calculerAge, formaterDateIso } from '../age';
import { calculerCast } from '../cast';
import { depistagesApplicables } from '../depistages';
import { calculerFace } from '../face';
import { verifierFacturation } from '../facturation';
import { calculerFagerstrom, pointsCigarettesParJour } from '../fagerstrom';
import { calculerHad } from '../had';
import { echellesHumeurApplicables, testApplicable } from '../humeur';
import { evaluerIcope } from '../icope';
import { calculerImc } from '../imc';
import { evaluerPa, type MesurePa } from '../pa';
import { evaluerPolymedication, evaluerReperesAlcool } from '../situations';
import { selectionnerTranche } from '../tranche';
import { lireReferentielsReels, scoresReels } from '../../referentiels/__tests__/fixtures';
import { chargerReferentiels } from '../../referentiels/loader';

/**
 * ORACLE : seconde transcription, indépendante, des grilles du livret Mon Bilan Prévention.
 *
 * Les valeurs ci-dessous sont recopiées directement du PDF (page citée), sans passer par
 * referentiels/*.json ni par le code de l'outil. Chaque règle est ensuite comparée à l'outil sur
 * l'ensemble des combinaisons possibles de réponses (ou sur une grille fine pour les mesures).
 * Une divergence révèle soit une erreur de transcription dans un référentiel, soit une erreur de calcul.
 *
 * Ce fichier est le seul endroit où des seuils figurent en dur : c'est voulu, il sert de témoin.
 */

const scores = scoresReels();
const chargement = chargerReferentiels(lireReferentielsReels());
if (!chargement.ok) throw new Error('référentiels invalides');

/** Produit cartésien de listes de valeurs. */
function produit<T>(listes: readonly (readonly T[])[]): T[][] {
  return listes.reduce<T[][]>((acc, l) => acc.flatMap((a) => l.map((x) => [...a, x])), [[]]);
}
const entiers = (min: number, max: number) => Array.from({ length: max - min + 1 }, (_, i) => min + i);

// ---------------------------------------------------------------- Âge et tranches (livret p. 3)
describe('Oracle - âge révolu et tranches (livret p. 3 : 18-25, 45-50, 60-65, 70-75, bornes incluses)', () => {
  const TRANCHES = [[18, 25], [45, 50], [60, 65], [70, 75]] as const;

  it('âge révolu : tous les jours de naissance de 1940 à 2012, pour 5 dates de RDV (dont un 29 février)', () => {
    const rdvs = ['2026-11-13', '2024-02-29', '2025-02-28', '2025-03-01', '2026-01-01'];
    let n = 0;
    for (const rdv of rdvs) {
      const [ry, rm, rd] = rdv.split('-').map(Number) as [number, number, number];
      for (let t = Date.UTC(1940, 0, 1); t <= Date.UTC(2012, 11, 31); t += 86_400_000) {
        const d = new Date(t);
        const [ny, nm, nd] = [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()];
        // Oracle : années pleines écoulées, l'anniversaire étant atteint si (mois, jour) du RDV ≥ (mois, jour) de naissance.
        const attendu = ry - ny - (rm * 100 + rd < nm * 100 + nd ? 1 : 0);
        const r = calculerAge(formaterDateIso(new Date(ny, nm - 1, nd)), rdv);
        if (!r.ok || r.age !== attendu) expect({ naissance: [ny, nm, nd], rdv, r }).toEqual({ naissance: [ny, nm, nd], rdv, r: { ok: true, age: attendu } });
        n++;
      }
    }
    expect(n).toBeGreaterThan(130_000);
  });

  it('tranche : âges de 0 à 110 ans', () => {
    const bornes = chargement.tranches.map((t) => t.tranche);
    for (const age of entiers(0, 110)) {
      const attendu = TRANCHES.find(([a, b]) => age >= a && age <= b);
      expect(selectionnerTranche(age, bornes)?.id ?? null, `${age} ans`).toBe(attendu ? `${attendu[0]}-${attendu[1]}` : null);
    }
  });
});

// ---------------------------------------------------------------- IMC
describe('Oracle - IMC = poids / taille², arrondi au dixième (PRD M4 ; seuils OMS « à vérifier »)', () => {
  it('toutes les tailles de 1,40 à 2,10 m (au cm) × tous les poids de 30,0 à 200,0 kg (à 100 g)', () => {
    const SEUILS_OMS = [[18.5, 'Insuffisance pondérale'], [25, 'Corpulence normale'], [30, 'Surpoids']] as const;
    let n = 0;
    for (const cm of entiers(140, 210)) {
      for (const p10 of entiers(300, 2000)) {
        // Oracle en arithmétique entière exacte : IMC×10 = p10 × 10 000 / cm², arrondi au plus proche (demi vers le haut).
        const imc10 = Math.floor((2 * p10 * 10_000 + cm * cm) / (2 * cm * cm));
        const message = SEUILS_OMS.find(([s]) => imc10 < s * 10)?.[1] ?? 'Obésité';
        const r = calculerImc({ tailleM: cm / 100, poidsKg: p10 / 10 }, scores.imc);
        if (!r.calculable || Math.round(r.imc * 10) !== imc10 || r.interpretation.message !== message) {
          expect({ cm, p10, r }).toEqual({ cm, p10, r: { calculable: true, imc: imc10 / 10, message } });
        }
        n++;
      }
    }
    expect(n).toBe(71 * 1701);
  });
});

// ---------------------------------------------------------------- Pression artérielle (livret p. 29 et 41)
describe('Oracle - pression artérielle (p. 41 : ≥ 140/90 → médecin traitant ; ≥ 180/110 → urgences, systolique OU diastolique)', () => {
  const niveau = (s: number, d: number) => (s >= 180 || d >= 110 ? 'rouge' : s >= 140 || d >= 90 ? 'orange' : 'aucun');
  const deux = (s: number, d: number, bras: MesurePa['bras'] = 'gauche'): MesurePa[] => [{ bras, systolique: s, diastolique: d }, { bras, systolique: s, diastolique: d }];

  it('toutes les PA entières de 60 à 260 / 30 à 160 mmHg (systolique > diastolique)', () => {
    let n = 0;
    for (const s of entiers(60, 260)) for (const d of entiers(30, Math.min(160, s - 1))) {
      const r = evaluerPa(deux(s, d), scores.pressionArterielle);
      const attendu = niveau(s, d);
      if (!r.complet || r.niveau !== attendu || r.bloquant !== (attendu === 'rouge')) expect({ s, d, r }).toEqual({ s, d, niveau: attendu });
      n++;
    }
    expect(n).toBeGreaterThan(15_000);
  });

  it('moyenne de 2 mesures : seuil comparé à la moyenne exacte (a + b ≥ 280 ⇔ moyenne ≥ 140)', () => {
    for (const [a, b] of produit([entiers(120, 200), entiers(120, 200)])) {
      const r = evaluerPa([{ bras: 'droit', systolique: a!, diastolique: 70 }, { bras: 'droit', systolique: b!, diastolique: 70 }], scores.pressionArterielle);
      const attendu = a! + b! >= 360 ? 'rouge' : a! + b! >= 280 ? 'orange' : 'aucun';
      expect(r.complet && r.niveau, `${a} et ${b}`).toBe(attendu);
    }
  });

  it('deux bras : le bras le plus haut est retenu (p. 29)', () => {
    for (const [sg, sd] of produit([[120, 145, 185], [125, 150, 182]])) {
      const r = evaluerPa([...deux(sg!, 80, 'gauche'), ...deux(sd!, 80, 'droit')], scores.pressionArterielle);
      const plusHaut = Math.max(sg!, sd!);
      expect(r.complet && r.retenue.systolique, `${sg} / ${sd}`).toBe(plusHaut);
      expect(r.complet && r.niveau).toBe(niveau(plusHaut, 80));
    }
  });

  it('moins de 2 mesures : pas de conclusion', () => {
    expect(evaluerPa([{ bras: 'gauche', systolique: 190, diastolique: 120 }], scores.pressionArterielle).complet).toBe(false);
  });
});

// ---------------------------------------------------------------- FACE (livret p. 32)
describe('Oracle - FACE (p. 32)', () => {
  // Points des réponses, dans l'ordre du livret.
  const POINTS = { q1: [0, 1, 2, 3, 4], q2: [0, 1, 2, 3, 4], q3: [0, 4], q4: [0, 4], q5: [0, 4] };
  const FAIBLE = 'Risque faible ou nul : renforcement des conduites favorables à la santé';
  const EXCESSIVE = 'Consommation excessive probable : intervention brève';
  const DEPENDANCE = 'Dépendance probable : proposer une consultation d’addictologie';
  const interpreter = (score: number, genre: string) => {
    const seuilBas = genre === 'H' ? 5 : 4; // H moins de 5 ; F moins de 4 ; genre non renseigné : seuils femmes (règle de prudence du PRD)
    return score < seuilBas ? FAIBLE : score <= 8 ? EXCESSIVE : DEPENDANCE; // H et F plus de 8 : dépendance
  };

  it('points des réponses identiques au livret', () => {
    for (const it_ of scores.face.items) expect(it_.options.map((o) => o.points), it_.id).toEqual(POINTS[it_.id as keyof typeof POINTS]);
  });

  it('les 200 combinaisons de réponses × 3 genres', () => {
    let n = 0;
    for (const [q1, q2, q3, q4, q5] of produit([POINTS.q1, POINTS.q2, POINTS.q3, POINTS.q4, POINTS.q5])) {
      for (const genre of ['H', 'F', 'NSP']) {
        const score = q1! + q2! + q3! + q4! + q5!;
        const r = calculerFace({ q1, q2, q3, q4, q5 }, genre, scores.face);
        expect(r.complet && [r.score, r.interpretation.message]).toEqual([score, interpreter(score, genre)]);
        n++;
      }
    }
    expect(n).toBe(600);
  });
});

// ---------------------------------------------------------------- Fagerström (livret p. 33)
describe('Oracle - Fagerström simplifié (p. 33)', () => {
  const pointsCigarettes = (n: number) => (n <= 10 ? 0 : n <= 20 ? 1 : n <= 30 ? 2 : 3);
  const DELAIS = [['Moins de 5 minutes', 3], ['6 à 30 minutes', 2], ['31 à 60 minutes', 1], ['Après plus d’1 heure', 0]] as const;
  const interpreter = (s: number) => (s <= 1 ? 'Pas de dépendance' : s <= 3 ? 'Dépendance modérée' : 'Dépendance forte');

  it('cigarettes par jour de 0 à 80 → points', () => {
    for (const n of entiers(0, 80)) expect(pointsCigarettesParJour(n, scores.fagerstrom), `${n}`).toBe(pointsCigarettes(n));
  });
  it('délai de la première cigarette : libellés et points du livret', () => {
    expect(scores.fagerstrom.items[1]!.options.map((o) => [o.libelle, o.points])).toEqual(DELAIS.map(([l, p]) => [l, p]));
  });
  it('les 16 combinaisons de points', () => {
    for (const [c, d] of produit([[0, 1, 2, 3], [0, 1, 2, 3]])) {
      const r = calculerFagerstrom({ cigarettesParJour: c, delaiPremiereCigarette: d }, scores.fagerstrom);
      expect(r.complet && r.interpretation.message).toBe(interpreter(c! + d!));
    }
  });
});

// ---------------------------------------------------------------- CAST (p. 33) et ADRS (p. 34)
describe('Oracle - CAST (p. 33) et ADRS (p. 34) : toutes les combinaisons de réponses', () => {
  const CAST = (n: number) =>
    n === 0 ? 'Aucune réponse positive' : n === 1 ? 'Une réponse positive : information minimale sur les risques' : n === 2 ? 'Deux réponses positives : intervention brève' : 'Trois réponses positives ou plus : proposer une consultation d’addictologie';
  const ADRS = (n: number) => (n <= 3 ? 'Absence de souffrance psychologique' : n <= 6 ? 'État de souffrance psychologique' : 'État de dépression');

  it('CAST : 6 questions, 64 combinaisons', () => {
    expect(scores.cast.items).toHaveLength(6);
    for (const rep of produit(Array.from({ length: 6 }, () => [true, false]))) {
      const r = calculerCast(Object.fromEntries(rep.map((v, i) => [`q${i + 1}`, v])), scores.cast);
      expect(r.complet && r.interpretation.message).toBe(CAST(rep.filter(Boolean).length));
    }
  });
  it('ADRS : 10 questions, 1 024 combinaisons', () => {
    expect(scores.adrs.items).toHaveLength(10);
    for (const rep of produit(Array.from({ length: 10 }, () => [true, false]))) {
      const r = calculerAdrs(Object.fromEntries(rep.map((v, i) => [`q${i + 1}`, v])), scores.adrs);
      expect(r.complet && r.interpretation.message).toBe(ADRS(rep.filter(Boolean).length));
    }
  });
});

// ---------------------------------------------------------------- HAD (p. 34-35)
describe('Oracle - HAD (p. 34-35)', () => {
  // Points des 4 réponses de chaque item, dans l'ordre du livret.
  const POINTS: number[][] = [
    [3, 2, 1, 0], [0, 1, 2, 3], [3, 2, 1, 0], [0, 1, 2, 3], [3, 2, 1, 0], [3, 2, 1, 0], [0, 1, 2, 3],
    [3, 2, 1, 0], [0, 1, 2, 3], [3, 2, 1, 0], [3, 2, 1, 0], [0, 1, 2, 3], [3, 2, 1, 0], [0, 1, 2, 3],
  ];
  const interpreter = (s: number) => (s <= 7 ? 'Absence de symptomatologie' : s <= 10 ? 'Symptomatologie douteuse' : 'Symptomatologie certaine');

  it('points des 14 items identiques au livret ; A = items impairs, D = items pairs', () => {
    scores.had.items.forEach((it_, i) => {
      expect(it_.options.map((o) => o.points), it_.id).toEqual(POINTS[i]);
      expect(it_.dimension, it_.id).toBe(i % 2 === 0 ? 'A' : 'D');
    });
  });

  it('chaque dimension : les 16 384 combinaisons de ses 7 items', () => {
    for (const dim of ['A', 'D'] as const) {
      const items = scores.had.items.filter((x) => x.dimension === dim).map((x) => x.id);
      const autres = Object.fromEntries(scores.had.items.filter((x) => x.dimension !== dim).map((x) => [x.id, 0]));
      for (const pts of produit(items.map(() => [0, 1, 2, 3]))) {
        const r = calculerHad({ ...autres, ...Object.fromEntries(items.map((id, i) => [id, pts[i]])) }, scores.had).find((x) => x.dimension === dim)!;
        const somme = pts.reduce((a, b) => a + b, 0);
        if (!r.complet || r.score !== somme || r.interpretation.message !== interpreter(somme)) expect({ dim, pts, r }).toEqual({ somme, message: interpreter(somme) });
      }
    }
  });
});

// ---------------------------------------------------------------- Échelles et tests selon l'âge (p. 11, 34)
describe('Oracle - tests proposés selon l’âge', () => {
  it('ADRS de 18 à 20 ans, HAD à partir de 20 ans (p. 34), Amsler « si > 60 ans » (p. 11)', () => {
    for (const age of entiers(0, 110)) {
      const attendu = [...(age >= 18 && age <= 20 ? ['adrs'] : []), ...(age >= 20 ? ['had'] : [])];
      expect(echellesHumeurApplicables(age, scores), `${age} ans`).toEqual(attendu);
      expect(testApplicable('amsler', age, scores), `${age} ans`).toBe(age > 60);
    }
  });
});

// ---------------------------------------------------------------- ICOPE (p. 31)
describe('Oracle - ICOPE mobilité (p. 31 : normal si 5 levers en moins de 14 secondes)', () => {
  it('temps de 0 à 30 s au dixième, et levers non réalisés', () => {
    for (const dixiemes of entiers(0, 300)) {
      const t = dixiemes / 10;
      const r = evaluerIcope({ mobilite: { cinqLeversRealises: true, tempsSecondes: t } }, scores.icope);
      expect(r.domaines.find((d) => d.id === 'mobilite')!.statut, `${t} s`).toBe(t < 14 ? 'negatif' : 'positif');
    }
    expect(evaluerIcope({ mobilite: { cinqLeversRealises: false } }, scores.icope).domaines.find((d) => d.id === 'mobilite')!.statut).toBe('positif');
  });
  it('mots à retenir et questions d’orientation du livret', () => {
    expect(scores.icope.motsARetenir).toEqual(['citron', 'clé', 'ballon']);
    expect(scores.icope.questionsOrientation).toEqual(['Année', 'Jour de la semaine', 'Mois', 'Jour du mois']);
  });
});

// ---------------------------------------------------------------- Dépistages (fiches thématiques p. 14)
describe('Oracle - dépistages organisés (fiches thématiques p. 14)', () => {
  it('âges de 18 à 80 ans × 3 genres × risque élevé colorectal et sein', () => {
    let n = 0;
    for (const [age, genre, reColo, reSein] of produit<number | string | boolean>([entiers(18, 80), ['H', 'F', 'NSP'], [false, true], [false, true]])) {
      const femmePossible = genre !== 'H';
      const attendu: string[] = [];
      if (!reColo && (age as number) >= 50 && (age as number) <= 74) attendu.push('colorectal');
      if (!reSein && femmePossible && (age as number) >= 50 && (age as number) <= 74) attendu.push('sein');
      if (femmePossible && (age as number) >= 25 && (age as number) <= 65) attendu.push('col');
      if (reColo) attendu.push('RE:colorectal');
      if (reSein && femmePossible) attendu.push('RE:sein');
      const r = depistagesApplicables({ age: age as number, genre: genre as string, risqueEleve: { colorectal: reColo as boolean, sein: reSein as boolean } }, scores.depistages);
      expect(r.map((d) => (d.type === 'risque-eleve' ? `RE:${d.id}` : d.id)), `${age} ${genre} ${reColo} ${reSein}`).toEqual(attendu);
      n++;
    }
    expect(n).toBe(63 * 3 * 4);
  });
});

// ---------------------------------------------------------------- Situations (kit p. 41, autoquestionnaire, facturation p. 21)
describe('Oracle - polymédication, repères alcool, facturation', () => {
  it('polymédication : alerte au-delà de 10 traitements (p. 41)', () => {
    for (const n of entiers(0, 40)) expect(evaluerPolymedication(n, scores.polymedication) !== null, `${n}`).toBe(n > 10);
  });
  it('repères alcool : un seul repère dépassé suffit (8 combinaisons)', () => {
    for (const [a, b, c] of produit([[true, false], [true, false], [true, false]])) {
      const r = evaluerReperesAlcool({ plus2ParJour: a, plus10ParSemaine: b, moins2JoursSans: c }, scores.reperesAlcool);
      expect(r !== null).toBe(Boolean(a || b || c));
    }
  });
  it('facturation : RDP 30 € et au plus 1 acte parmi RVA et kit DOCCR (p. 21)', () => {
    for (const actes of [[], ['RVA'], ['DOCCR'], ['RVA', 'DOCCR'], ['JKHD001'], ['RVA', 'RVA']]) {
      const valide = actes.length <= 1 && actes.every((a) => a === 'RVA' || a === 'DOCCR');
      const r = verifierFacturation(actes, scores.facturation);
      expect([r.valide, r.acteBilan.code, r.acteBilan.montantEuros], actes.join('+')).toEqual([valide, 'RDP', 30]);
    }
  });
});
