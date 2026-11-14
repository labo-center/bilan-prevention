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
| Kit d'orientation pharmacien | `orientation.json` reprend la colonne pharmacien de l'annexe VI. Les cellules communes à l'infirmier, la sage-femme et le pharmacien sont reprises telles quelles ; seule « Santé sexuelle » a une cellule propre (« Délivrances : préservatifs sans ordonnance pour les moins de 26 ans »). Lecture des colonnes vérifiée sur le rendu image des pages 41 à 43 | Livret p. 41-43 |
| Thématiques sans entrée au kit | Ménopause, accès aux droits, santé auditive, chlordécone : ressources vides dans le PPP, signalées à l'écran | Livret p. 41-43 |
| Priorités | 1 ou 2 thématiques, choisies parmi celles des risques repérés et celles souhaitées par le patient (Q46), ou toute autre thématique | Livret p. 12 |
| Q46 → thématiques | « Améliorer mon alimentation et bouger plus » → alimentation et activité physique ; « Passer moins de temps devant un écran » → activité physique et sédentarité ; autres options en correspondance directe | Choix du concepteur, à valider |
| Ajout d'office | Idées suicidaires : la thématique « Bien-être mental et social » et ses ressources (31 14) sont ajoutées au PPP, hors du maximum de 2 priorités | PRD M10, livret p. 43 |
| Stades du changement | Les 6 stades du livret, avec leur description | Livret p. 37 |
| Balance décisionnelle | 4 cases : bénéfices et dommages perçus, à changer et à ne pas changer. Affichée d'office au stade « intention », à la demande pour les autres stades | Livret p. 36 et 38 |
| Questions ouvertes | Aucune liste de questions ouvertes dans les sources : l'écran affiche les consignes de la balance (p. 38) et, pour le tabac, les questions du livret p. 33 | Livret p. 33 et 38 |
| Suggestions du PPP | Freins : raisons du stade de préintention (livret p. 37). Conseils : « Les bons conseils pour prendre soin de soi » de l'autoquestionnaire 45-50 (p. 6-7). Rien n'est pré-rempli : le professionnel clique pour ajouter | Livret p. 37, autoquestionnaire p. 6-7 |
| Fiches thématiques | PDF officiel ouvert à la page de la fiche dans un panneau latéral, avec un lien de secours vers un nouvel onglet (certains navigateurs de tablette n'affichent pas un PDF intégré). Le PDF est livré à côté de la brique, pas dans brick.js (3,7 Mo) | PRD S5 |
| Durée de l'entretien | Repères du minuteur à 30 et 45 min (`scores.json`) ; orange à 45 min, sans interrompre la saisie | Livret p. 3 |
| Mention « INCOMPLET » | Portée par le PDF si l'IMC ou la PA manque (`calculsObligatoires` de `45-50.json`) ; les questionnaires (FACE, CAST…) ne sont pas obligatoires, ils dépendent des consommations | Choix du concepteur (PRD §8), à valider |
| Opposition au médecin traitant | Case officielle du PPP cochée « [X] », plus la mention du PRD « Le patient s’oppose à la transmission au médecin traitant. » | PPP p. 1, PRD M14 |
| Pied de page du PDF | Version des trois référentiels, état de validation et date d'édition | PRD M14 |
| Contrôle de facturation | RDP 30 € et au plus 1 acte complémentaire (RVA ou kit DOCCR) ; deux actes cochés bloquent l'export PDF | Livret p. 21, PRD S2 |
| PA retenue | Moyenne par bras ; bras retenu = le plus sévère au regard des seuils, puis la plus haute systolique. Comparaison sur la moyenne exacte (139,5 reste sous 140) | Livret p. 29 et 41 |

## Incrément 6 : tranches 18-25, 60-65 et 70-75
| Sujet | Décision | Source |
|---|---|---|
| Transcription | Autoquestionnaires (47, 51 et 52 questions) et fiches de repérage transcrits de chaque PDF ; éléments communs repris de 45-50 après comparaison texte à texte | Autoquestionnaires et fiches 18-25, 60-65, 70-75 |
| PPP et conseils patient | Identiques dans les 4 tranches (comparaison des PDF) | PPP et autoquestionnaires |
| ADRS / HAD en 18-25 | Les deux échelles figurent dans les tests de la tranche ; l'outil propose l'ADRS de 18 à 20 ans et la HAD à partir de 20 ans (les deux à 20 ans). La fiche 18-25 ne prévoit qu'un champ « Échelle HAD » : le résultat ADRS figure dans les résultats des tests du PDF | Livret p. 11 et 34 |
| Grille d'Amsler | Proposée à partir de 61 ans révolus (« si > 60 ans ») : pas à 60 ans | Livret p. 11 et 29 |
| ICOPE | Saisie par domaine selon le livret p. 31 ; critères hors mobilité toujours « à vérifier » | Livret p. 30-31 |
| Fiche 70-75 : cases « Idées suicidaires » et « Antécédent de passage à l’acte » | Absentes de la fiche officielle 70-75 (vérifié sur l'image), alors que l'autoquestionnaire pose la question (Q50). Ajoutées par l'outil, marquées « hors fiche officielle » à l'écran, pour l'alerte 31 14 (M10) | Fiche et autoquestionnaire 70-75 |
| Résultat d'Amsler sur la fiche 60-65 et 70-75 | Le libellé officiel « test de AMLER » est conservé tel quel ; le champ affiche le résultat saisi dans les tests | Fiches 60-65 et 70-75 |
| Correspondances par interprétation (« à vérifier ») | 18-25 : antécédents anxio-dépressifs depuis Q10. 60-65 : isolement si pas de contact avec les proches (Q4), conditions de travail pénibles (Q24), perte d'autonomie (Q26), regard négatif sur la retraite (Q41). 70-75 : perte d'autonomie si un geste du quotidien est difficile (Q25), risque de chute si logement non adapté (Q32), retraite (Q42) | Choix du concepteur, à valider |
| Thème grands caractères (C3) | Activé d'office à l'ouverture d'une session 70-75, désactivable ; disponible pour toutes les tranches par le bouton « Grands caractères » | PRD C3 |

## À vérifier (absent des sources fournies)
| Élément | État dans le référentiel |
|---|---|
| Seuils IMC (OMS adulte) | Présents, `aVerifier: true` (HYP9) |
| Seuil de dénutrition à 70 ans et plus | Non implémenté : aucun seuil dans les sources fournies (HYP9). Le domaine nutrition d'ICOPE et la case « Perte d’appétit » de la fiche couvrent le repérage |
| ICOPE : critères de positivité hors mobilité, orientation médecin traitant | Présents, `aVerifier: true` ; seul le critère de mobilité (< 14 s) est sourcé |
| PHQ-4 | Les 4 items sont les questions Q40 à Q43 de l'autoquestionnaire, mais ni la cotation ni les seuils ne figurent dans les sources : pas de calcul. Le champ « Résultat au test Score PHQ4 » de la fiche se saisit librement, avec les réponses Q40 à Q43 rappelées à côté |
| Q46 (sujets que le patient souhaite aborder) | Réponses conservées en session, exploitées à la décision partagée (incrément 4) |
| Niveaux de couleur (rouge / orange / info) | Choix de tri du PRD (étape 4), les sources ne définissent que les messages |

## Validation
La validation sépare la lecture du livret (revue des règles par le pharmacien référent, `docs/validation/dossier-validation.md`, sans calcul manuel) et l'exactitude du calcul (comparaison exhaustive de l'outil à une seconde transcription indépendante des grilles, `src/logic/__tests__/oracle.test.ts`, plus 20 cas complets de non-régression). Le pilote prévoit une double saisie papier sur les 3 premiers bilans réels (PRD §9).
