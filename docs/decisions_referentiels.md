# Décisions et points à vérifier sur les référentiels

Ce document trace les écarts entre le PRD et les sources officielles, et les choix faits en attendant la validation du pharmacien référent (HYP5). Toute valeur listée ici comme « à vérifier » porte `"aVerifier": true` dans le référentiel et s'affiche comme telle.

## Décisions validées
| Sujet | Décision | Source |
|---|---|---|
| Genre | 3 options de la fiche de repérage (Homme, Femme, Ne souhaite pas répondre), sans « Autre » | Fiche de repérage 45-50, p. 1 |
| ADRS / HAD | ADRS de 18 à 20 ans, HAD à partir de 20 ans ; à 20 ans les deux sont proposées et le professionnel choisit. Le tableau p. 11 (HAD coché pour 45-50 seulement) est jugé moins précis que le texte de l'annexe III | Livret p. 34 |
| Spirométrie | Applicable à 45-50, 60-65 et 70-75 ans (lève HYP3 pour ce test) | Livret p. 11 |
| FACE, genre non renseigné | Seuils femmes appliqués (les plus protecteurs) et signalés à l'écran. Règle de prudence du PRD, non issue des sources | PRD §6.2 |
| Dépistages, genre non renseigné | Aucun dépistage sexué masqué : affiché avec la mention « si la personne est concernée » | Choix de prudence |
| Risque élevé déclaré | Remplace le dépistage organisé correspondant, quel que soit l'âge | Fiches thématiques p. 14 |
| Genre dans l'autoquestionnaire | Q1 garde ses 3 options du PDF (« Une femme », « Un homme », « Autre ») ; la réponse n'alimente pas le genre de la session, saisi par le professionnel à l'ouverture | Autoquestionnaire 45-50, p. 1 |
| Correspondance autoquestionnaire → fiche | Table `mapping` de `45-50.json`. Les correspondances qui demandent une interprétation (activité physique, fruits et légumes, sédentarité, écrans, sommeil < 6 h) portent `aVerifier: true` | Choix du concepteur, à valider |
| Saisie du professionnel | Prioritaire : un champ modifié par le professionnel n'est plus recalculé depuis l'autoquestionnaire | PRD §6.2 étape 2 |
| Champ « Nombre de traitements en cours » | Aide au calcul ajoutée à la fiche pour la règle polymédication (> 10), signalée comme absente de la fiche officielle | Kit d'orientation p. 41 |
| Thématiques | Liste des 17 fiches thématiques (`scores.json`), chaque règle et chaque section de fiche y est rattachée | Fiches thématiques, table des matières |
| PA retenue | Moyenne par bras ; bras retenu = le plus sévère au regard des seuils, puis la plus haute systolique. Comparaison sur la moyenne exacte (139,5 reste sous 140) | Livret p. 29 et 41 |

## À vérifier (absent des sources fournies)
| Élément | État dans le référentiel |
|---|---|
| Seuils IMC (OMS adulte) | Présents, `aVerifier: true` (HYP9) |
| Seuil de dénutrition à 70 ans et plus | Non saisi, à traiter avec la tranche 70-75 (incrément 6) |
| ICOPE : critères de positivité hors mobilité, orientation médecin traitant | Présents, `aVerifier: true` ; seul le critère de mobilité (< 14 s) est sourcé |
| PHQ-4 | Les 4 items sont les questions Q40 à Q43 de l'autoquestionnaire, mais ni la cotation ni les seuils ne figurent dans les sources : pas de calcul. Le champ « Résultat au test Score PHQ4 » de la fiche se saisit librement, avec les réponses Q40 à Q43 rappelées à côté |
| Q46 (sujets que le patient souhaite aborder) | Réponses conservées en session, exploitées à la décision partagée (incrément 4) |
| Niveaux de couleur (rouge / orange / info) | Choix de tri du PRD (étape 4), les sources ne définissent que les messages |
