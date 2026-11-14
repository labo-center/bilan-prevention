# Dossier de validation - Copilote Mon Bilan Prévention

Document généré par `npm run validation:dossier` à partir des référentiels (18-25 v0.1.0, 45-50 v0.4.0, 60-65 v0.1.0, 70-75 v0.1.0, scores v0.3.0, orientation v0.2.0). Ne pas modifier à la main.

## Principe
La validation sépare deux questions :
1. **Les règles sont-elles celles du livret ?** C'est le rôle du pharmacien référent : relire les règles ci-dessous, en clair, chacune avec sa source, et cocher. Aucun calcul n'est demandé.
2. **L'outil applique-t-il correctement ces règles ?** C'est vérifié automatiquement, de façon exhaustive (partie C), à chaque modification du code ou d'un référentiel.

Le pilote (partie D) contrôle enfin l'outil sur de vrais bilans.

## Partie A - Règles reprises des documents officiels
Pour chaque ligne : la règle appliquée par l'outil correspond-elle à la source citée ?

| N° | Règle | Ce que fait l'outil | Source | Avis |
|---|---|---|---|---|
| A1 | Tranches d’âge | 18 à 25 ans, 45 à 50 ans, 60 à 65 ans, 70 à 75 ans, bornes incluses, âge révolu au jour du RDV ; hors tranche : session refusée | Livret p. 3 | ☐ Conforme ☐ Non conforme |
| A2 | Tests par tranche | 18-25 : IMC, acuité visuelle, voix chuchotée, PA, FACE, Fagerström, CAST, ADRS, HAD / 45-50 : IMC, acuité visuelle, voix chuchotée, PA, spirométrie, FACE, Fagerström, CAST, HAD / 60-65 : IMC, acuité visuelle, grille d’Amsler, voix chuchotée, PA, ICOPE, spirométrie, FACE, Fagerström, CAST, HAD / 70-75 : IMC, acuité visuelle, grille d’Amsler, voix chuchotée, PA, ICOPE, spirométrie, FACE, Fagerström, CAST, HAD | Livret p. 11 | ☐ Conforme ☐ Non conforme |
| A3 | ADRS ou HAD selon l’âge | ADRS de 18 à 20 ans, HAD à partir de 20 ans (les deux à 20 ans) | Livret p. 34 | ☐ Conforme ☐ Non conforme |
| A4 | Grille d’Amsler | Proposée à partir de 61 ans révolus (« si > 60 ans ») ; anomalie : Lignes déformées, ondulées ou taches sombres : orienter rapidement vers un ophtalmologue (moins d’une semaine) (alerte rouge) | Livret p. 11 et 29 | ☐ Conforme ☐ Non conforme |
| A5 | Pression artérielle | Au moins 2 mesures ; moyenne par bras, bras le plus haut retenu ; systolique ≥ 180 ou diastolique ≥ 110 : « Si PA ≥ 180/110 mm Hg, orienter vers les urgences » (alerte rouge bloquante, à acquitter) ; systolique ≥ 140 ou diastolique ≥ 90 : « Si PA ≥ 140/90 mmHg, orienter vers le médecin traitant pour confirmation » | Livret p. 29 et 41 | ☐ Conforme ☐ Non conforme |
| A6 | FACE | Hommes : 0 à 4 : Risque faible ou nul : renforcement des conduites favorables à la santé ; 5 à 8 : Consommation excessive probable : intervention brève ; 9 à 20 : Dépendance probable : proposer une consultation d’addictologie. Femmes : 0 à 3 : Risque faible ou nul : renforcement des conduites favorables à la santé ; 4 à 8 : Consommation excessive probable : intervention brève ; 9 à 20 : Dépendance probable : proposer une consultation d’addictologie. Genre non renseigné : seuils femmes (Règle de prudence du PRD §6.2, non issue des documents officiels) | Livret p. 32 | ☐ Conforme ☐ Non conforme |
| A7 | Fagerström simplifié | Cigarettes par jour : 10 ou moins = 0, 11 à 20 = 1, 21 à 30 = 2, 31 ou plus = 3 ; délai : Moins de 5 minutes = 3, 6 à 30 minutes = 2, 31 à 60 minutes = 1, Après plus d’1 heure = 0 ; 0 à 1 : Pas de dépendance ; 2 à 3 : Dépendance modérée ; 4 à 6 : Dépendance forte | Livret p. 33 | ☐ Conforme ☐ Non conforme |
| A8 | CAST | 0 : Aucune réponse positive ; 1 : Une réponse positive : information minimale sur les risques ; 2 : Deux réponses positives : intervention brève ; 3 à 6 : Trois réponses positives ou plus : proposer une consultation d’addictologie | Livret p. 33 | ☐ Conforme ☐ Non conforme |
| A9 | ADRS | Nombre de « vrai » : 0 à 3 : Absence de souffrance psychologique ; 4 à 6 : État de souffrance psychologique ; 7 à 10 : État de dépression | Livret p. 34 | ☐ Conforme ☐ Non conforme |
| A10 | HAD | A = items impairs, D = items pairs, chacun : 0 à 7 : Absence de symptomatologie ; 8 à 10 : Symptomatologie douteuse ; 11 à 21 : Symptomatologie certaine | Livret p. 34-35 | ☐ Conforme ☐ Non conforme |
| A11 | ICOPE, mobilité | Positif si 5 levers non réalisés ou réalisés en 14 s ou plus | Livret p. 31 | ☐ Conforme ☐ Non conforme |
| A12 | Repères alcool | Un seul repère dépassé suffit : vous buvez plus de 2 verres standards par jour ; vous buvez plus de 10 verres standards par semaine ; vous ne buvez pas de boissons alcoolisées au moins 2 jours dans la semaine → « Repères de consommation dépassés : évaluation du risque (questionnaire FACE) » | Autoquestionnaire, livret p. 32 | ☐ Conforme ☐ Non conforme |
| A13 | Polymédication | Plus de 10 traitements : « Polymédication (> 10 traitements) : informer le médecin traitant » | Livret p. 41 | ☐ Conforme ☐ Non conforme |
| A14 | Idées suicidaires | Alerte rouge sur tous les écrans : « Numéro national de prévention du suicide, en cas d’idées noires ou d’idées suicidaires : 31 14 » ; « Bien-être mental et social » et ses ressources ajoutés d’office au PPP | Livret p. 43 | ☐ Conforme ☐ Non conforme |
| A15 | Médecin traitant absent | « Si pas de médecin traitant, signaler, avec l’accord du patient, la situation à la CPAM » | Fiches de repérage p. 1 | ☐ Conforme ☐ Non conforme |
| A16 | Dépistages organisés | Test de dépistage organisé du cancer colorectal : hommes et femmes de 50 à 74 ans ; Mammographie de dépistage organisé du cancer du sein : femmes de 50 à 74 ans ; Dépistage du cancer du col de l’utérus : femmes de 25 à 65 ans ; risque élevé ou très élevé coché : dépistage spécifique à la place, quel que soit l’âge | Fiches thématiques p. 14 | ☐ Conforme ☐ Non conforme |
| A17 | Kit d’orientation pharmacien | Ressources du PPP reprises de la colonne pharmacien pour 13 thématiques (ex. tabac : Tabac Info Service (3989), CSAPA et CAARUD, Centres Jeunes Consommateurs (CJC), Associations d’entraide, groupe de paroles …, Substituts nicotiniques) | Livret p. 41 à 43 | ☐ Conforme ☐ Non conforme |
| A18 | Décision partagée | 1 à 2 priorités | Livret p. 12 | ☐ Conforme ☐ Non conforme |
| A19 | Facturation | RDP 30 €, au plus 1 acte en sus parmi RVA, DOCCR | Livret p. 21 | ☐ Conforme ☐ Non conforme |
| A20 | Durée de l’entretien | Repères du minuteur à 30 et 45 min | Livret p. 3 | ☐ Conforme ☐ Non conforme |

## Partie B - Choix à valider (absents des documents officiels)
Ces éléments ne figurent pas tels quels dans les sources ; l'outil les signale « à vérifier » à l'écran tant qu'ils ne sont pas validés.

| N° | Sujet | Choix actuel | Décision |
|---|---|---|---|
| B1 | Seuils d’IMC | 0 à 18,4 : Insuffisance pondérale ; 18,5 à 24,9 : Corpulence normale ; 25 à 29,9 : Surpoids ; ≥ 30 : Obésité (seuils OMS, absents des sources) | ☐ Accepté ☐ À modifier : |
| B2 | ICOPE, critères hors mobilité | Cognition : Au moins un mot non rappelé ou une réponse d’orientation temporo-spatiale erronée ; Nutrition : Perte de poids involontaire d’au moins 3 kg en 3 mois ou perte d’appétit récente ; Vision : Réponse « oui » à « Avez-vous des problèmes avec vos yeux ? » ; Audition : Au moins une oreille incapable de répéter les mots chuchotés ; Psychologie : Au moins une réponse « oui » aux deux questions sur les deux dernières semaines ; si un domaine est positif : « Domaine positif : orientation vers le médecin traitant » | ☐ Accepté ☐ À modifier : |
| B3 | Mention « INCOMPLET » sur le PDF | Si un de ces calculs manque : IMC, PA | ☐ Accepté ☐ À modifier : |
| B4 | Fiche 70-75 : cases ajoutées | « Idées suicidaires » et « Antécédent de passage à l’acte » : absentes de la fiche officielle, ajoutées pour l’alerte 31 14 | ☐ Accepté ☐ À modifier : |
| B5 | Grands caractères | Activés d’office pour les 70-75 ans, désactivables | ☐ Accepté ☐ À modifier : |
| B6 | Pré-remplissage 18-25 par interprétation | Q10 « Dépression et/ou troubles anxieux et/ou troubles du comportement alimentaire (anorexie, boulimie…) » → « Antécédents de troubles anxio-dépressifs » ; Q21 « Jamais / 1 à 2 fois par semaine » → « Activité physique insuffisante » ; Q22 « Entre 1 et 4 portions par jour / De temps en temps / Rarement / Jamais » → « Consommation de fruits et légumes insuffisante » ; Q24 « Plus de 7 heures » → « Sédentarité » ; Q25 « Plus de 4 heures » → « Temps d’écran important » ; Q40 « Moins de 6h par nuit » → « Sommeil insuffisant et/ou de mauvaise qualité » | ☐ Accepté ☐ À modifier : |
| B7 | Pré-remplissage 45-50 par interprétation | Q24 « Jamais / 1 à 2 fois par semaine » → « Activité physique insuffisante » ; Q25 « Entre 1 et 4 portions par jour / De temps en temps / Rarement / Jamais » → « Consommation de fruits et légumes insuffisante » ; Q27 « Plus de 7 heures » → « Sédentarité » ; Q28 « Plus de 4 heures » → « Temps d’écran important » ; Q39 « Moins de 6h par nuit » → « Sommeil insuffisant et/ou de mauvaise qualité » | ☐ Accepté ☐ À modifier : |
| B8 | Pré-remplissage 60-65 par interprétation | Q4 « Non » → « Situation d’isolement » ; Q28 « Entre 1 et 4 portions par jour / De temps en temps / Rarement / Jamais » → « Consommation de fruits et légumes insuffisante » ; Q30 « Plus de 7 heures » → « Sédentarité » ; Q41 « Plutôt négatif » → « Si passage à la retraite mal vécu : précisez » ; Q41 « Très négatif » → « Si passage à la retraite mal vécu : précisez » ; Q44 « Moins de 6h par nuit » → « Sommeil insuffisant et/ou de mauvaise qualité » ; Q24 « Oui » → « Conditions de travail pénibles : Moralement » ; Q26 « Oui » → « Perte d’autonomie/dépendance » ; Q27 « Jamais / 1 à 2 fois par semaine » → « Activité physique insuffisante, si oui pourquoi » ; Q31 « Plus de 4 heures » → « Temps d’écran important » | ☐ Accepté ☐ À modifier : |
| B9 | Pré-remplissage 70-75 par interprétation | Q4 « Non » → « Situation d’isolement » ; Q27 « Entre 1 et 4 portions par jour / De temps en temps / Rarement / Jamais » → « Consommation de fruits et légumes insuffisante » ; Q29 « Plus de 7 heures » → « Sédentarité » ; Q42 « Plutôt négatif » → « Si passage à la retraite mal vécu : précisez » ; Q42 « Très négatif » → « Si passage à la retraite mal vécu : précisez » ; Q45 « Moins de 6h par nuit » → « Sommeil insuffisant et/ou de mauvaise qualité » ; Q25 « Quitter son lit et/ou se coucher seul(e) / Aller seul(e) aux toilettes / Faire sa toilette seul(e) / Se vêtir et/ou se dévêtir seul(e) / Manger et boire seul(e) / Marcher seul(e) avec ou sans béquille, canne… / Utiliser seul(e) un moyen de transport (transports en commun, voiture….) » → « Perte d’autonomie/dépendance » ; Q26 « Jamais » → « Activité physique, si non pourquoi » ; Q26 « 1 à 2 fois par semaine » → « Activité physique, si non pourquoi » ; Q32 « Non » → « La personne présente des risques, précisez » | ☐ Accepté ☐ À modifier : |

## Partie C - Vérification automatique du calcul (aucune action demandée)
Exécutée par `npm test` ; elle bloque toute modification qui ferait diverger l'outil.

| Vérification | Couverture |
|---|---|
| Seconde transcription indépendante du livret (`src/logic/__tests__/oracle.test.ts`), comparée à l'outil | Âge révolu : chaque jour de naissance de 1940 à 2012, pour 5 dates de RDV (plus de 130 000 cas) ; tranches : 0 à 110 ans ; IMC : 120 771 couples taille-poids ; PA : toutes les valeurs entières de 60 à 260 / 30 à 160 mmHg, moyennes de 2 mesures, deux bras ; FACE : 200 combinaisons × 3 genres ; Fagerström, CAST, ADRS : toutes les combinaisons ; HAD : 16 384 combinaisons par dimension ; ICOPE mobilité : 0 à 30 s au dixième ; dépistages : 18 à 80 ans × 3 genres × risques élevés ; polymédication, repères alcool, facturation |
| Points des réponses (FACE, Fagerström, HAD) | Comparés un à un à la seconde transcription |
| 20 cas complets de non-régression (`validation/cas-tests.json`) | Parcours de saisie complet, du questionnaire aux alertes : C01, C02, C03, C04, C05, C06, C07, C08, C09, C10, C11, C12, C13, C14, C15, C16, C17, C18, C19, C20 |

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

Après validation : renseigner `dateValidation` dans chaque référentiel ; la mention « non validé par le pharmacien référent » disparaît alors de l'écran et du PDF.
