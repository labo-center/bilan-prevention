// Génère docs/validation/dossier-validation.md : la revue des règles par le pharmacien référent.
// Toutes les valeurs affichées sont lues dans referentiels/*.json : la fiche suit toute modification.
// Usage : npm run validation:dossier (génère) ; node scripts/dossier-validation.mjs --verifier (contrôle, utilisé par les tests)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const racine = resolve(import.meta.dirname, '..');
const lire = (f) => JSON.parse(readFileSync(resolve(racine, f), 'utf8'));
const scores = lire('referentiels/scores.json');
const orientation = lire('referentiels/orientation.json');
const IDS = ['18-25', '45-50', '60-65', '70-75'];
const tranches = Object.fromEntries(IDS.map((t) => [t, lire(`referentiels/${t}.json`)]));
const { cas } = lire('validation/cas-tests.json');

const p = (src) => `p. ${src.page}`;
/** Grille de seuils en clair : bornes entières (scores) ou au dixième (IMC). */
const nb = (x) => String(Math.round(x * 10) / 10).replace('.', ',');
const seuils = (liste) => {
  const pas = liste.some((s) => s.max !== null && !Number.isInteger(s.max)) ? 0.1 : 1;
  return liste.map((s, i) => {
    const bas = i === 0 ? 0 : liste[i - 1].max + pas;
    const plage = s.max === null ? `≥ ${nb(bas)}` : bas === s.max ? nb(s.max) : `${nb(bas)} à ${nb(s.max)}`;
    return `${plage} : ${s.message}`;
  }).join(' ; ');
};
const NOMS_TESTS = { imc: 'IMC', 'acuite-visuelle': 'acuité visuelle', amsler: 'grille d’Amsler', 'voix-chuchotee': 'voix chuchotée', 'pression-arterielle': 'PA', icope: 'ICOPE', spirometrie: 'spirométrie', face: 'FACE', fagerstrom: 'Fagerström', cast: 'CAST', adrs: 'ADRS', had: 'HAD' };
const CASE = '☐ Conforme ☐ Non conforme';

const regles = [];
const regle = (titre, outil, source) => regles.push({ titre, outil, source });

regle('Tranches d’âge', IDS.map((t) => `${tranches[t].tranche.ageMin} à ${tranches[t].tranche.ageMax} ans`).join(', ') + ', bornes incluses, âge révolu au jour du RDV ; hors tranche : session refusée', 'Livret p. 3');
regle('Tests par tranche', IDS.map((t) => `${t} : ${tranches[t].testsApplicables.items.map((x) => NOMS_TESTS[x.id] ?? x.id).join(', ')}`).join(' / '), 'Livret p. 11');
regle('ADRS ou HAD selon l’âge', `ADRS de ${scores.adrs.applicabilite.ageMin} à ${scores.adrs.applicabilite.ageMax} ans, HAD à partir de ${scores.had.applicabilite.ageMin} ans (les deux à ${scores.had.applicabilite.ageMin} ans)`, 'Livret p. 34');
regle('Grille d’Amsler', `Proposée à partir de ${scores.amsler.applicabilite.ageMin} ans révolus (« si > 60 ans ») ; anomalie : ${scores.amsler.siAnormal.message} (alerte rouge)`, 'Livret p. 11 et 29');
regle('Pression artérielle', `Au moins ${scores.pressionArterielle.mesuresMin} mesures ; moyenne par bras, bras le plus haut retenu ; ` + scores.pressionArterielle.seuils.map((s) => `systolique ≥ ${s.systolique} ou diastolique ≥ ${s.diastolique} : « ${s.message} »${s.bloquant ? ' (alerte rouge bloquante, à acquitter)' : ''}`).join(' ; '), 'Livret p. 29 et 41');
regle('FACE', `Hommes : ${seuils(scores.face.seuilsParGenre.H)}. Femmes : ${seuils(scores.face.seuilsParGenre.F)}. Genre non renseigné : seuils ${scores.face.genreNonRenseigne.appliquer === 'F' ? 'femmes' : 'hommes'} (${scores.face.genreNonRenseigne.origine})`, `Livret ${p(scores.face.source)}`);
regle('Fagerström simplifié', `Cigarettes par jour : ${scores.fagerstrom.items[0].options.map((o) => `${o.libelle} = ${o.points}`).join(', ')} ; délai : ${scores.fagerstrom.items[1].options.map((o) => `${o.libelle} = ${o.points}`).join(', ')} ; ${seuils(scores.fagerstrom.seuils)}`, `Livret ${p(scores.fagerstrom.source)}`);
regle('CAST', seuils(scores.cast.seuils), `Livret ${p(scores.cast.source)}`);
regle('ADRS', `Nombre de « vrai » : ${seuils(scores.adrs.seuils)}`, `Livret ${p(scores.adrs.source)}`);
regle('HAD', `A = items impairs, D = items pairs, chacun : ${seuils(scores.had.seuils)}`, `Livret ${p(scores.had.source)}`);
regle('ICOPE, mobilité', `Positif si 5 levers non réalisés ou réalisés en ${scores.icope.mobiliteSecondesMax} s ou plus`, 'Livret p. 31');
regle('Repères alcool', `Un seul repère dépassé suffit : ${scores.reperesAlcool.reperes.map((r) => r.libelle.toLowerCase()).join(' ; ')} → « ${scores.reperesAlcool.siDepasse.message} »`, `Autoquestionnaire, livret p. 32`);
regle('Polymédication', `Plus de ${scores.polymedication.nombreTraitementsMax} traitements : « ${scores.polymedication.siDepasse.message} »`, `Livret ${p(scores.polymedication.source)}`);
regle('Idées suicidaires', `Alerte rouge sur tous les écrans : « ${scores.ideesSuicidaires.siCoche.message} » ; « Bien-être mental et social » et ses ressources ajoutés d’office au PPP`, `Livret ${p(scores.ideesSuicidaires.source)}`);
regle('Médecin traitant absent', `« ${scores.medecinTraitant.siAbsent.message} »`, 'Fiches de repérage p. 1');
regle('Dépistages organisés', scores.depistages.organises.map((d) => `${d.libelle} : ${d.genres.length === 2 ? 'hommes et femmes' : 'femmes'} de ${d.ageMin} à ${d.ageMax} ans`).join(' ; ') + ' ; risque élevé ou très élevé coché : dépistage spécifique à la place, quel que soit l’âge', `Fiches thématiques ${p(scores.depistages.source)}`);
regle('Kit d’orientation pharmacien', `Ressources du PPP reprises de la colonne pharmacien pour ${orientation.kit.thematiques.length} thématiques (ex. tabac : ${orientation.kit.thematiques.find((t) => t.thematique === 'addictions').ressources.pharmacien.map((r) => r.libelle).join(', ')})`, 'Livret p. 41 à 43');
regle('Décision partagée', `1 à ${orientation.decisionPartagee.prioritesMax} priorités`, `Livret ${p(orientation.decisionPartagee.source)}`);
regle('Facturation', `${scores.facturation.acteBilan.code} ${scores.facturation.acteBilan.montantEuros} €, au plus ${scores.facturation.maxActesComplementaires} acte en sus parmi ${scores.facturation.actesComplementaires.map((a) => a.code).join(', ')}`, `Livret ${p(scores.facturation.source)}`);
regle('Durée de l’entretien', `Repères du minuteur à ${scores.dureeEntretien.reperesMinutes.join(' et ')} min`, `Livret ${p(scores.dureeEntretien.source)}`);

// Décisions à prendre : tout ce qui n'est pas écrit tel quel dans les sources.
const decisions = [];
decisions.push(['Seuils d’IMC', `${seuils(scores.imc.seuils)} (seuils OMS, absents des sources)`]);
decisions.push(['ICOPE, critères hors mobilité', scores.icope.domaines.filter((d) => d.aVerifier).map((d) => `${d.libelle} : ${d.critere}`).join(' ; ') + ` ; si un domaine est positif : « ${scores.icope.siPositif.message} »`]);
decisions.push(['Mention « INCOMPLET » sur le PDF', `Si un de ces calculs manque : ${tranches['45-50'].export.calculsObligatoires.map((x) => NOMS_TESTS[x] ?? x).join(', ')}`]);
decisions.push(['Fiche 70-75 : cases ajoutées', tranches['70-75'].ficheReperage.sections.flatMap((s) => s.champs).filter((c) => c.horsFicheOfficielle).map((c) => `« ${c.libelle} »`).join(' et ') + ' : absentes de la fiche officielle, ajoutées pour l’alerte 31 14']);
decisions.push(['Grands caractères', 'Activés d’office pour les 70-75 ans, désactivables']);
for (const t of IDS) {
  const ref = tranches[t];
  const qs = Object.fromEntries(ref.autoquestionnaire.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));
  const champs = Object.fromEntries(ref.ficheReperage.sections.flatMap((s) => s.champs).map((c) => [c.id, c]));
  const lignes = ref.mapping.regles.filter((r) => r.aVerifier).map((r) => {
    const q = qs[r.question];
    const reps = r.siReponse.map((x) => q.options.find((o) => o.id === x).libelle).join(' / ');
    return `${r.question} « ${reps} » → « ${champs[r.champ].libelle} »`;
  });
  decisions.push([`Pré-remplissage ${t} par interprétation`, lignes.join(' ; ')]);
}

const echapper = (s) => String(s).replace(/\|/g, '\\|');
const sortie = [];
sortie.push(`# Dossier de validation - Copilote Mon Bilan Prévention

Document généré par \`npm run validation:dossier\` à partir des référentiels (${IDS.map((t) => `${t} v${tranches[t].version}`).join(', ')}, scores v${scores.version}, orientation v${orientation.version}). Ne pas modifier à la main.

## Principe
La validation sépare deux questions :
1. **Les règles sont-elles celles du livret ?** C'est le rôle du pharmacien référent : relire les règles ci-dessous, en clair, chacune avec sa source, et cocher. Aucun calcul n'est demandé.
2. **L'outil applique-t-il correctement ces règles ?** C'est vérifié automatiquement, de façon exhaustive (partie C), à chaque modification du code ou d'un référentiel.

Le pilote (partie D) contrôle enfin l'outil sur de vrais bilans.

## Partie A - Règles reprises des documents officiels
Pour chaque ligne : la règle appliquée par l'outil correspond-elle à la source citée ?

| N° | Règle | Ce que fait l'outil | Source | Avis |
|---|---|---|---|---|`);
regles.forEach((r, i) => sortie.push(`| A${i + 1} | ${r.titre} | ${echapper(r.outil)} | ${r.source} | ${CASE} |`));

sortie.push(`
## Partie B - Choix à valider (absents des documents officiels)
Ces éléments ne figurent pas tels quels dans les sources ; l'outil les signale « à vérifier » à l'écran tant qu'ils ne sont pas validés.

| N° | Sujet | Choix actuel | Décision |
|---|---|---|---|`);
decisions.forEach(([s, c], i) => sortie.push(`| B${i + 1} | ${s} | ${echapper(c)} | ☐ Accepté ☐ À modifier : |`));

sortie.push(`
## Partie C - Vérification automatique du calcul (aucune action demandée)
Exécutée par \`npm test\` ; elle bloque toute modification qui ferait diverger l'outil.

| Vérification | Couverture |
|---|---|
| Seconde transcription indépendante du livret (\`src/logic/__tests__/oracle.test.ts\`), comparée à l'outil | Âge révolu : chaque jour de naissance de 1940 à 2012, pour 5 dates de RDV (plus de 130 000 cas) ; tranches : 0 à 110 ans ; IMC : 120 771 couples taille-poids ; PA : toutes les valeurs entières de 60 à 260 / 30 à 160 mmHg, moyennes de 2 mesures, deux bras ; FACE : 200 combinaisons × 3 genres ; Fagerström, CAST, ADRS : toutes les combinaisons ; HAD : 16 384 combinaisons par dimension ; ICOPE mobilité : 0 à 30 s au dixième ; dépistages : 18 à 80 ans × 3 genres × risques élevés ; polymédication, repères alcool, facturation |
| Points des réponses (FACE, Fagerström, HAD) | Comparés un à un à la seconde transcription |
| ${cas.length} cas complets de non-régression (\`validation/cas-tests.json\`) | Parcours de saisie complet, du questionnaire aux alertes : ${cas.map((c) => c.id).join(', ')} |

Cette comparaison a déjà mis en évidence et fait corriger une erreur d'arrondi de l'IMC (35,2 kg et 1,60 m : 13,8 et non 13,7).

## Partie D - Pilote : 3 premiers bilans réels en double saisie (PRD §9, phase 3)
Remplir la fiche papier comme d'habitude, saisir le même bilan dans l'outil, comparer scores, alertes et orientations.

| Bilan | Date | Tranche | Scores identiques | Alertes identiques | Orientations identiques | Écart constaté |
|---|---|---|---|---|---|---|
| 1 | | | ☐ oui ☐ non | ☐ oui ☐ non | ☐ oui ☐ non | |
| 2 | | | ☐ oui ☐ non | ☐ oui ☐ non | ☐ oui ☐ non | |
| 3 | | | ☐ oui ☐ non | ☐ oui ☐ non | ☐ oui ☐ non | |

## Conclusion

| | |
|---|---|
| Règles non conformes (partie A) | |
| Choix à modifier (partie B) | |
| Écarts du pilote (partie D) | |
| Décision (mise en service autorisée / refusée) | |
| Nom du pharmacien référent | |
| Date | |
| Signature | |

Après validation : renseigner \`dateValidation\` dans chaque référentiel ; la mention « non validé par le pharmacien référent » disparaît alors de l'écran et du PDF.
`);

const cible = resolve(racine, 'docs/validation/dossier-validation.md');
const contenu = sortie.join('\n');
if (process.argv.includes('--verifier')) {
  // Utilisé par npm test : le dossier relu par le pharmacien doit refléter les référentiels en vigueur.
  const actuel = readFileSync(cible, 'utf8');
  if (actuel !== contenu) {
    console.error('Dossier de validation périmé : lancer npm run validation:dossier');
    process.exit(1);
  }
} else {
  writeFileSync(cible, contenu);
  console.info('docs/validation/dossier-validation.md généré');
}
