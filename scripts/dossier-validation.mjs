// Génère docs/validation/dossier-validation.md à partir de validation/cas-tests.json et des référentiels.
// Usage : npm run validation:dossier
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(import.meta.dirname, '..');
const lire = (f) => JSON.parse(readFileSync(resolve(racine, f), 'utf8'));
const { version, dateRdv, note, cas } = lire('validation/cas-tests.json');
const scores = lire('referentiels/scores.json');
const tranches = Object.fromEntries(['18-25', '45-50', '60-65', '70-75'].map((t) => [t, lire(`referentiels/${t}.json`)]));

const dateFr = (iso) => iso.split('-').reverse().join('/');
const GENRES = { H: 'Homme', F: 'Femme', NSP: 'Ne souhaite pas répondre' };
const LIBELLES = {
  age: 'Âge révolu au RDV', trancheId: 'Tranche', theme: 'Thème d’affichage', echelles: 'Échelles et tests proposés selon l’âge',
  imc: 'IMC et interprétation', pa: 'PA retenue et orientation', face: 'FACE : score et interprétation',
  faceSeuilsFemmesParDefaut: 'FACE : seuils femmes appliqués faute de genre', fagerstrom: 'Fagerström : score et interprétation',
  cast: 'CAST : score et interprétation', adrs: 'ADRS : score et interprétation', hadA: 'HAD anxiété (A)', hadD: 'HAD dépression (D)',
  icopePositifs: 'ICOPE : domaines positifs', reperesAlcool: 'Repères alcool dépassés', polymedication: 'Polymédication (> 10 traitements)',
  medecinTraitantAbsent: 'Signalement CPAM (pas de médecin traitant)', depistages: 'Dépistages à rappeler', alertesRouges: 'Alertes rouges',
  ficheDeclaree: 'Cases pré-remplies depuis l’autoquestionnaire',
};
/** Libellés lisibles des identifiants techniques (alertes, cases de fiche, dépistages). */
function libelles(tranche) {
  const champs = Object.fromEntries(tranches[tranche].ficheReperage.sections.flatMap((x) => x.champs).map((ch) => [ch.id, ch.libelle]));
  const tests = { pa: 'Pression artérielle', imc: 'IMC', face: 'FACE', fagerstrom: 'Fagerström', cast: 'CAST', adrs: 'ADRS', 'had-A': 'HAD anxiété', 'had-D': 'HAD dépression', amsler: 'Grille d’Amsler', icope: 'ICOPE', had: 'HAD' };
  const dep = Object.fromEntries(scores.depistages.organises.map((d) => [d.id, d.libelle]));
  const depRE = Object.fromEntries(scores.depistages.risqueEleve.map((d) => [d.id, d.libelle]));
  return (id) => {
    const si = /^(.*) \(si concerné\)$/.exec(id);
    if (si) return `${dep[si[1]] ?? si[1]} (si concerné)`;
    if (id.startsWith('RE:')) return depRE[id.slice(3)] ?? id;
    return tests[id] ?? champs[id] ?? dep[id] ?? id;
  };
}
const texte = (v) => (Array.isArray(v) ? (v.length ? v.join(', ') : 'aucun') : v === true ? 'oui' : v === false ? 'non' : String(v));
const echapper = (s) => String(s).replace(/\|/g, '\\|');

function questions(t) {
  return Object.fromEntries(tranches[t].autoquestionnaire.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));
}

/** Description lisible des entrées d'un cas. */
function entrees(c) {
  const l = [];
  l.push(`- Date de naissance : ${dateFr(c.ouverture.dateNaissance)} ; genre : ${GENRES[c.ouverture.genre]}`);
  const qs = questions(c.tranche);
  for (const [id, v] of Object.entries(c.autoquestionnaire ?? {})) {
    const q = qs[id];
    const reps = [v].flat().map((x) => q.options?.find((o) => o.id === x)?.libelle ?? x);
    l.push(`- Autoquestionnaire ${id} « ${q.libelle} » : ${reps.join(', ')}`);
  }
  const champs = Object.fromEntries(tranches[c.tranche].ficheReperage.sections.flatMap((s) => s.champs).map((ch) => [ch.id, ch]));
  for (const [id, v] of Object.entries(c.fiche ?? {})) l.push(`- Fiche, « ${champs[id].libelle} » : ${v === true ? 'cochée' : v}`);
  const m = c.mesures ?? {};
  l.push(`- Taille : ${m.tailleM !== undefined ? `${String(m.tailleM).replace('.', ',')} m` : 'non mesurée'} ; poids : ${m.poidsKg !== undefined ? `${String(m.poidsKg).replace('.', ',')} kg` : 'non mesuré'}`);
  if (m.pa) l.push(`- Mesures de PA : ${m.pa.map(([b, s, d], i) => `n° ${i + 1} bras ${b} ${s}/${d}`).join(' ; ')}`);
  const q = c.questionnaires ?? {};
  if (q.face) l.push(`- FACE : ${scores.face.items.map((it) => `Q${it.id.slice(1)} « ${it.options.find((o) => o.points === q.face[it.id]).libelle} »`).join(' ; ')}`);
  if (q.fagerstrom) l.push(`- Fagerström : ${q.fagerstrom.cigarettesParJour} cigarettes par jour ; première cigarette : ${q.fagerstrom.delai}`);
  if (q.cast) l.push(`- CAST : réponses ${q.cast.map((x, i) => `Q${i + 1} ${x ? 'oui' : 'non'}`).join(', ')}`);
  if (q.adrs) l.push(`- ADRS : ${q.adrs.map((x, i) => `${i + 1} ${x ? 'vrai' : 'faux'}`).join(', ')}`);
  if (q.had) l.push(`- HAD : ${scores.had.items.map((it, i) => `${i + 1} « ${it.options.find((o) => o.points === q.had[i]).libelle} »`).join(' ; ')}`);
  if (q.amsler) l.push(`- Grille d’Amsler : ${q.amsler === 'anormal' ? 'lignes déformées, ondulées ou taches sombres' : 'normale'}`);
  if (q.icope) {
    const i = q.icope;
    const p = [];
    if (i.cognition?.motsRappeles) p.push(`mots rappelés ${i.cognition.motsRappeles.map((x, k) => `${scores.icope.motsARetenir[k]} ${x ? 'oui' : 'non'}`).join(', ')}`);
    if (i.cognition?.orientationCorrecte) p.push(`orientation ${i.cognition.orientationCorrecte.every(Boolean) ? 'entièrement correcte' : 'au moins une erreur'}`);
    if (i.nutrition) p.push(`perte ≥ 3 kg en 3 mois ${texte(i.nutrition.perte3kgEn3Mois ?? 'non renseigné')}, perte d’appétit ${texte(i.nutrition.perteAppetit ?? 'non renseigné')}`);
    if (i.vision) p.push(`problème avec les yeux ${texte(i.vision.problemeYeux)}`);
    if (i.audition) p.push(`chuchotement oreille droite ${i.audition.oreilleDroiteOk ? 'réussi' : 'échoué'}, oreille gauche ${i.audition.oreilleGaucheOk ? 'réussi' : 'échoué'}`);
    if (i.psychologie) p.push(`déprimé ${texte(i.psychologie.deprime)}, perte d’intérêt ${texte(i.psychologie.perteInteret)}`);
    if (i.mobilite) p.push(i.mobilite.cinqLeversRealises ? `5 levers de chaise en ${String(i.mobilite.tempsSecondes).replace('.', ',')} s` : '5 levers de chaise non réalisés');
    l.push(`- ICOPE étape 1 : ${p.join(' ; ')} ; autres domaines non évalués`);
  }
  return l.join('\n');
}

const sortie = [];
sortie.push(`# Dossier de validation initiale - Copilote Mon Bilan Prévention

Document généré par \`npm run validation:dossier\` à partir de \`validation/cas-tests.json\` (version ${version}). Ne pas modifier à la main.

**Objet** : rejouer 20 cas (5 par tranche) dont les résultats sont calculés à la main par le pharmacien référent, et vérifier que l'outil donne exactement les mêmes résultats (PRD §8 et §9 ; écart toléré : 0).

**Référentiels** : ${Object.values(tranches).map((t) => `${t.tranche.id} v${t.version}`).join(', ')}, scores v${scores.version}. Date de rendez-vous de tous les cas : ${dateFr(dateRdv)}.

**Mode opératoire**
1. Partie 1 : pour chaque cas, calculer à la main chaque résultat à partir des seules entrées et des grilles du livret, sans consulter la partie 2.
2. Partie 2 : comparer avec le résultat attendu par l'outil, noter tout écart et son analyse.
3. Signer la conclusion. En cas d'écart, l'outil n'est pas mis en service avant correction et nouveau rejeu.

Le rejeu automatique (\`npm test\`, fichier \`src/logic/__tests__/validation.test.ts\`) vérifie à chaque modification du code ou d'un référentiel que l'outil retrouve les résultats de la partie 2.

> ${note}
`);

sortie.push('## Partie 1 - Cas à calculer à la main\n');
for (const c of cas) {
  // L'objet du cas n'est pas affiché ici : il révélerait les résultats attendus.
  sortie.push(`### ${c.id} - ${c.tranche} ans\n\n${entrees(c)}\n`);
  sortie.push('| Élément à calculer | Calcul manuel du pharmacien |\n|---|---|');
  for (const cle of Object.keys(c.attendu)) sortie.push(`| ${LIBELLES[cle] ?? cle} | |`);
  sortie.push('');
}

sortie.push(`## Partie 2 - Résultats attendus et comparaison

À consulter uniquement après le calcul manuel de la partie 1. « RE: » signale un dépistage pour risque élevé ou très élevé ; « bloquante » une alerte à acquitter avant de poursuivre.
`);
for (const c of cas) {
  const lib = libelles(c.tranche);
  sortie.push(`### ${c.id} - ${c.tranche} ans : ${c.objet}\n\n| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |\n|---|---|---|---|`);
  for (const [cle, v] of Object.entries(c.attendu)) {
    const valeur = Array.isArray(v) && ['alertesRouges', 'ficheDeclaree', 'depistages', 'echelles'].includes(cle) ? v.map(lib) : v;
    sortie.push(`| ${LIBELLES[cle] ?? cle} | ${echapper(texte(valeur))} | | |`);
  }
  sortie.push('');
}

sortie.push(`## Conclusion

| | |
|---|---|
| Nombre de cas rejoués | 20 |
| Nombre d’écarts constatés | |
| Écarts corrigés et rejoués | |
| Décision (mise en service autorisée / refusée) | |
| Nom du pharmacien référent | |
| Date | |
| Signature | |
`);

writeFileSync(resolve(racine, 'docs/validation/dossier-validation.md'), sortie.join('\n'));
console.info('docs/validation/dossier-validation.md généré');
