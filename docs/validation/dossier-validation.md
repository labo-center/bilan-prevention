# Dossier de validation initiale - Copilote Mon Bilan Prévention

Document généré par `npm run validation:dossier` à partir de `validation/cas-tests.json` (version 1.0.0). Ne pas modifier à la main.

**Objet** : rejouer 20 cas (5 par tranche) dont les résultats sont calculés à la main par le pharmacien référent, et vérifier que l'outil donne exactement les mêmes résultats (PRD §8 et §9 ; écart toléré : 0).

**Référentiels** : 18-25 v0.1.0, 45-50 v0.4.0, 60-65 v0.1.0, 70-75 v0.1.0, scores v0.3.0. Date de rendez-vous de tous les cas : 13/11/2026.

**Mode opératoire**
1. Partie 1 : pour chaque cas, calculer à la main chaque résultat à partir des seules entrées et des grilles du livret, sans consulter la partie 2.
2. Partie 2 : comparer avec le résultat attendu par l'outil, noter tout écart et son analyse.
3. Signer la conclusion. En cas d'écart, l'outil n'est pas mis en service avant correction et nouveau rejeu.

Le rejeu automatique (`npm test`, fichier `src/logic/__tests__/validation.test.ts`) vérifie à chaque modification du code ou d'un référentiel que l'outil retrouve les résultats de la partie 2.

> Résultats attendus calculés à la main à partir des grilles du livret (annexes III et VI) et des fiches thématiques, indépendamment du code. Ils doivent être recalculés et validés par le pharmacien référent (PRD §8 et §9).

## Partie 1 - Cas à calculer à la main

### C01 - 45-50 ans

- Date de naissance : 10/05/1979 ; genre : Femme
- Autoquestionnaire Q4 « Assumez-vous un rôle d’aidant ? » : Oui
- Taille : 1,75 m ; poids : 80 kg
- Mesures de PA : n° 1 bras gauche 145/85 ; n° 2 bras gauche 145/85
- FACE : Q1 « Deux à 3 fois par semaine » ; Q2 « 3 ou 4 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Tranche | |
| Échelles et tests proposés selon l’âge | |
| IMC et interprétation | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C02 - 45-50 ans

- Date de naissance : 13/11/1976 ; genre : Homme
- Taille : 1,8 m ; poids : 95 kg
- Mesures de PA : n° 1 bras gauche 182/100 ; n° 2 bras gauche 182/100
- FACE : Q1 « Quatre fois par semaine ou plus » ; Q2 « 3 ou 4 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- Fagerström : 15 cigarettes par jour ; première cigarette : 6 à 30 minutes

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Tranche | |
| IMC et interprétation | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| Fagerström : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C03 - 45-50 ans

- Date de naissance : 13/11/1981 ; genre : Femme
- Autoquestionnaire Q44 « Avez-vous déjà eu des idées noires/suicidaires ou fait une tentative de suicide ? » : Oui, des idées noires/suicidaires
- Taille : 1,6 m ; poids : 47 kg
- Mesures de PA : n° 1 bras droit 139/89 ; n° 2 bras droit 139/89
- HAD : 1 « La plupart du temps » ; 2 « Presque plus » ; 3 « Oui, très nettement » ; 4 « Plus du tout » ; 5 « Très souvent » ; 6 « Jamais » ; 7 « Oui, quoi qu’il arrive » ; 8 « Presque toujours » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| PA retenue et orientation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C04 - 45-50 ans

- Date de naissance : 02/03/1978 ; genre : Ne souhaite pas répondre
- Fiche, « Nombre de traitements en cours » : 11
- Fiche, « Médecin traitant » : non
- Taille : non mesurée ; poids : 70 kg
- Mesures de PA : n° 1 bras gauche 130/80 ; n° 2 bras droit 150/92
- FACE : Q1 « Deux à 4 fois par mois » ; Q2 « 5 ou 6 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- CAST : réponses Q1 oui, Q2 oui, Q3 oui, Q4 non, Q5 non, Q6 non

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| FACE : seuils femmes appliqués faute de genre | |
| CAST : score et interprétation | |
| Polymédication (> 10 traitements) | |
| Signalement CPAM (pas de médecin traitant) | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C05 - 45-50 ans

- Date de naissance : 20/01/1977 ; genre : Homme
- Autoquestionnaire Q33 « Au cours de l’année écoulée, concernant votre consommation de boissons alcoolisées : » : Vous buvez plus de 10 verres standards par semaine
- Fiche, « Dépistage du cancer colorectal chez un patient à risque élevé/très élevé » : cochée
- Taille : 1,7 m ; poids : 72,25 kg
- Mesures de PA : n° 1 bras gauche 138/85 ; n° 2 bras gauche 142/85
- FACE : Q1 « Quatre fois par semaine ou plus » ; Q2 « 3 ou 4 » ; Q3 « Oui » ; Q4 « Non » ; Q5 « Non »
- Fagerström : 31 cigarettes par jour ; première cigarette : Moins de 5 minutes
- CAST : réponses Q1 oui, Q2 oui, Q3 non, Q4 non, Q5 non, Q6 non

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| PA retenue et orientation | |
| Repères alcool dépassés | |
| FACE : score et interprétation | |
| Fagerström : score et interprétation | |
| CAST : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C06 - 18-25 ans

- Date de naissance : 13/11/2008 ; genre : Femme
- Autoquestionnaire Q35 « Vous arrive-t-il de consommer rapidement une quantité importante de boissons alcoolisées afin d’obtenir une sensation d’ivresse ? » : Oui
- Taille : 1,65 m ; poids : 58 kg
- Mesures de PA : n° 1 bras gauche 118/72 ; n° 2 bras gauche 118/72
- ADRS : 1 vrai, 2 vrai, 3 vrai, 4 vrai, 5 faux, 6 faux, 7 faux, 8 faux, 9 faux, 10 faux

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Tranche | |
| Échelles et tests proposés selon l’âge | |
| IMC et interprétation | |
| PA retenue et orientation | |
| ADRS : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C07 - 18-25 ans

- Date de naissance : 13/11/2006 ; genre : Homme
- Taille : 1,78 m ; poids : 70 kg
- Mesures de PA : n° 1 bras gauche 125/80 ; n° 2 bras gauche 125/80
- ADRS : 1 vrai, 2 vrai, 3 vrai, 4 vrai, 5 vrai, 6 vrai, 7 vrai, 8 faux, 9 faux, 10 faux
- HAD : 1 « La plupart du temps » ; 2 « Presque plus » ; 3 « Oui, très nettement » ; 4 « Plus du tout » ; 5 « Assez souvent » ; 6 « Assez souvent » ; 7 « Oui, quoi qu’il arrive » ; 8 « Jamais » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Échelles et tests proposés selon l’âge | |
| ADRS : score et interprétation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C08 - 18-25 ans

- Date de naissance : 13/11/2001 ; genre : Femme
- Autoquestionnaire Q45 « Avez-vous déjà eu des idées noires/suicidaires ou fait une tentative de suicide ? » : Oui, une ou des tentatives de suicide
- Taille : 1,68 m ; poids : 52 kg
- Mesures de PA : n° 1 bras gauche 140/80 ; n° 2 bras gauche 140/80
- CAST : réponses Q1 oui, Q2 non, Q3 non, Q4 non, Q5 non, Q6 non
- HAD : 1 « Jamais » ; 2 « Oui, tout autant » ; 3 « Pas du tout » ; 4 « Autant que par le passé » ; 5 « Très occasionnellement » ; 6 « La plupart du temps » ; 7 « Oui, quoi qu’il arrive » ; 8 « Jamais » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Échelles et tests proposés selon l’âge | |
| IMC et interprétation | |
| PA retenue et orientation | |
| CAST : score et interprétation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C09 - 18-25 ans

- Date de naissance : 10/05/2004 ; genre : Homme
- Autoquestionnaire Q37 « Avez-vous consommé d’autres substances au cours des 12 derniers mois ? Cannabis (haschisch, marijuana, herbe, joint ou shit), d’autres drogues (ecstasy, cocaïne, héroïne, etc.) ou du protoxyde d’azote ? » : Oui, du protoxyde d’azote
- Autoquestionnaire Q45 « Avez-vous déjà eu des idées noires/suicidaires ou fait une tentative de suicide ? » : Oui, des idées noires/suicidaires
- Taille : 1,8 m ; poids : 75 kg
- Mesures de PA : n° 1 bras gauche 179/109 ; n° 2 bras gauche 179/109
- FACE : Q1 « Deux à 4 fois par mois » ; Q2 « 5 ou 6 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- Fagerström : 10 cigarettes par jour ; première cigarette : Après plus d’1 heure

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Échelles et tests proposés selon l’âge | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| Fagerström : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C10 - 18-25 ans

- Date de naissance : 01/07/2002 ; genre : Femme
- Taille : 1,62 m ; poids : 80 kg
- Mesures de PA : n° 1 bras gauche 110/70 ; n° 2 bras gauche 110/70
- FACE : Q1 « Deux à 3 fois par semaine » ; Q2 « 1 ou 2 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- HAD : 1 « La plupart du temps » ; 2 « Presque plus » ; 3 « Oui, très nettement » ; 4 « Plus du tout » ; 5 « Très souvent » ; 6 « Jamais » ; 7 « Rarement » ; 8 « Parfois » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| FACE : score et interprétation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C11 - 60-65 ans

- Date de naissance : 13/11/1966 ; genre : Homme
- Taille : 1,75 m ; poids : 70 kg
- Mesures de PA : n° 1 bras gauche 120/80 ; n° 2 bras gauche 120/80
- ICOPE étape 1 : mots rappelés citron oui, clé oui, ballon oui ; orientation entièrement correcte ; perte ≥ 3 kg en 3 mois non, perte d’appétit non ; problème avec les yeux non ; chuchotement oreille droite réussi, oreille gauche réussi ; déprimé non, perte d’intérêt non ; 5 levers de chaise en 10 s ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Tranche | |
| Échelles et tests proposés selon l’âge | |
| IMC et interprétation | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C12 - 60-65 ans

- Date de naissance : 02/03/1965 ; genre : Femme
- Taille : 1,62 m ; poids : 60 kg
- Mesures de PA : n° 1 bras gauche 160/100 ; n° 2 bras gauche 160/100
- Grille d’Amsler : lignes déformées, ondulées ou taches sombres
- ICOPE étape 1 : problème avec les yeux oui ; 5 levers de chaise en 13,9 s ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Échelles et tests proposés selon l’âge | |
| PA retenue et orientation | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C13 - 60-65 ans

- Date de naissance : 15/08/1963 ; genre : Homme
- Taille : 1,72 m ; poids : 78 kg
- Mesures de PA : n° 1 bras gauche 180/100 ; n° 2 bras gauche 180/100
- FACE : Q1 « Quatre fois par semaine ou plus » ; Q2 « 10 ou plus » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- Grille d’Amsler : normale
- ICOPE étape 1 : mots rappelés citron oui, clé non, ballon oui ; orientation entièrement correcte ; 5 levers de chaise en 14 s ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C14 - 60-65 ans

- Date de naissance : 13/11/1961 ; genre : Femme
- Autoquestionnaire Q4 « Au cours des 6 derniers mois, avez-vous eu des contacts avec des proches (amis, membres de votre famille) ? » : Non
- Fiche, « Nombre de traitements en cours » : 10
- Taille : 1,58 m ; poids : 62 kg
- Mesures de PA : n° 1 bras gauche 135/85 ; n° 2 bras gauche 135/85
- HAD : 1 « La plupart du temps » ; 2 « Presque plus » ; 3 « Oui, très nettement » ; 4 « Plus du tout » ; 5 « Occasionnellement » ; 6 « Rarement » ; 7 « Oui, quoi qu’il arrive » ; 8 « Jamais » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »
- Grille d’Amsler : normale

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| PA retenue et orientation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Polymédication (> 10 traitements) | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C15 - 60-65 ans

- Date de naissance : 01/02/1962 ; genre : Homme
- Autoquestionnaire Q49 « Avez-vous déjà eu des idées noires/suicidaires ou fait une tentative de suicide ? » : Oui, des idées noires/suicidaires
- Fiche, « Dépistage du cancer colorectal chez un patient à risque élevé/très élevé » : cochée
- Taille : 1,8 m ; poids : 105 kg
- Mesures de PA : n° 1 bras gauche 130/110 ; n° 2 bras gauche 130/110

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| PA retenue et orientation | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C16 - 70-75 ans

- Date de naissance : 13/11/1956 ; genre : Femme
- Taille : 1,6 m ; poids : 58 kg
- Mesures de PA : n° 1 bras gauche 128/78 ; n° 2 bras gauche 128/78
- Grille d’Amsler : lignes déformées, ondulées ou taches sombres
- ICOPE étape 1 : chuchotement oreille droite réussi, oreille gauche échoué ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| Tranche | |
| Thème d’affichage | |
| Échelles et tests proposés selon l’âge | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C17 - 70-75 ans

- Date de naissance : 13/11/1951 ; genre : Homme
- Taille : 1,7 m ; poids : 60 kg
- Mesures de PA : n° 1 bras gauche 150/85 ; n° 2 bras gauche 150/85
- FACE : Q1 « Quatre fois par semaine ou plus » ; Q2 « 3 ou 4 » ; Q3 « Oui » ; Q4 « Non » ; Q5 « Non »
- ICOPE étape 1 : mots rappelés citron oui, clé oui, ballon oui ; orientation entièrement correcte ; perte ≥ 3 kg en 3 mois non, perte d’appétit non ; problème avec les yeux non ; chuchotement oreille droite réussi, oreille gauche réussi ; déprimé non, perte d’intérêt non ; 5 levers de chaise en 12 s ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| IMC et interprétation | |
| PA retenue et orientation | |
| FACE : score et interprétation | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C18 - 70-75 ans

- Date de naissance : 10/05/1954 ; genre : Femme
- Autoquestionnaire Q25 « Avez-vous des difficultés à réaliser certains gestes de la vie quotidienne ? » : Marcher seul(e) avec ou sans béquille, canne…
- Autoquestionnaire Q32 « Avez-vous un logement adapté à la prévention des chutes ? (douche plutôt qu’une baignoire, barre de douche, revêtement anti-chutes, WC surélevé, …) » : Non
- Autoquestionnaire Q50 « Avez-vous déjà eu des idées noires/suicidaires ou fait une tentative de suicide ? » : Oui, des idées noires/suicidaires
- Taille : 1,55 m ; poids : 50 kg
- Mesures de PA : n° 1 bras gauche 130/80 ; n° 2 bras gauche 130/80
- ICOPE étape 1 : perte ≥ 3 kg en 3 mois oui, perte d’appétit non renseigné ; autres domaines non évalués

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| ICOPE : domaines positifs | |
| Dépistages à rappeler | |
| Alertes rouges | |
| Cases pré-remplies depuis l’autoquestionnaire | |

### C19 - 70-75 ans

- Date de naissance : 01/06/1952 ; genre : Ne souhaite pas répondre
- Taille : 1,65 m ; poids : 65 kg
- Mesures de PA : n° 1 bras gauche 125/80 ; n° 2 bras gauche 125/80
- FACE : Q1 « Une fois par mois ou moins » ; Q2 « 7 à 9 » ; Q3 « Non » ; Q4 « Non » ; Q5 « Non »
- Fagerström : 21 cigarettes par jour ; première cigarette : 31 à 60 minutes
- CAST : réponses Q1 non, Q2 non, Q3 non, Q4 non, Q5 non, Q6 non

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| FACE : score et interprétation | |
| FACE : seuils femmes appliqués faute de genre | |
| CAST : score et interprétation | |
| Fagerström : score et interprétation | |
| Dépistages à rappeler | |
| Alertes rouges | |

### C20 - 70-75 ans

- Date de naissance : 20/03/1953 ; genre : Homme
- Fiche, « Nombre de traitements en cours » : 12
- Fiche, « Médecin traitant » : non
- Taille : 1,74 m ; poids : 74 kg
- Mesures de PA : n° 1 bras gauche 178/108 ; n° 2 bras gauche 178/108 ; n° 3 bras droit 181/95
- HAD : 1 « Jamais » ; 2 « Presque plus » ; 3 « Pas du tout » ; 4 « Plus du tout » ; 5 « Très occasionnellement » ; 6 « Jamais » ; 7 « Oui, quoi qu’il arrive » ; 8 « Très souvent » ; 9 « Jamais » ; 10 « J’y prête autant d’attention que par le passé » ; 11 « Pas du tout » ; 12 « Autant qu’avant » ; 13 « Jamais » ; 14 « Souvent »

| Élément à calculer | Calcul manuel du pharmacien |
|---|---|
| Âge révolu au RDV | |
| PA retenue et orientation | |
| HAD anxiété (A) | |
| HAD dépression (D) | |
| Polymédication (> 10 traitements) | |
| Signalement CPAM (pas de médecin traitant) | |
| Dépistages à rappeler | |
| Alertes rouges | |

## Partie 2 - Résultats attendus et comparaison

À consulter uniquement après le calcul manuel de la partie 1. « RE: » signale un dépistage pour risque élevé ou très élevé ; « bloquante » une alerte à acquitter avant de poursuivre.

### C01 - 45-50 ans : Femme 47 ans : IMC en surpoids, PA ≥ 140/90, FACE femme 4 (seuil), rôle d’aidant déclaré

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 47 | | |
| Tranche | 45-50 | | |
| Échelles et tests proposés selon l’âge | HAD | | |
| IMC et interprétation | 26,1 - Surpoids | | |
| PA retenue et orientation | 145/85 - orange | | |
| FACE : score et interprétation | 4 - Consommation excessive probable : intervention brève | | |
| Dépistages à rappeler | Dépistage du cancer du col de l’utérus | | |
| Alertes rouges | aucun | | |
| Cases pré-remplies depuis l’autoquestionnaire | Rôle d’aidant | | |

### C02 - 45-50 ans : Homme 50 ans le jour du RDV (borne haute) : PA ≥ 180/110, FACE homme 5 (seuil), Fagerström 3

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 50 | | |
| Tranche | 45-50 | | |
| IMC et interprétation | 29,3 - Surpoids | | |
| PA retenue et orientation | 182/100 - rouge bloquante | | |
| FACE : score et interprétation | 5 - Consommation excessive probable : intervention brève | | |
| Fagerström : score et interprétation | 3 - Dépendance modérée | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal | | |
| Alertes rouges | Pression artérielle | | |

### C03 - 45-50 ans : Femme 45 ans le jour du RDV (borne basse) : insuffisance pondérale, PA 139/89 (sous le seuil), HAD A 9 et D 12, idées suicidaires

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 45 | | |
| IMC et interprétation | 18,4 - Insuffisance pondérale | | |
| PA retenue et orientation | 139/89 - aucune orientation | | |
| HAD anxiété (A) | 9 - Symptomatologie douteuse | | |
| HAD dépression (D) | 12 - Symptomatologie certaine | | |
| Dépistages à rappeler | Dépistage du cancer du col de l’utérus | | |
| Alertes rouges | HAD dépression, Idées suicidaires | | |
| Cases pré-remplies depuis l’autoquestionnaire | Idées suicidaires | | |

### C04 - 45-50 ans : Genre non renseigné, 48 ans : taille absente, PA sur deux bras, FACE 4 avec seuils femmes, CAST 3, polymédication, sans médecin traitant

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 48 | | |
| IMC et interprétation | non calculable | | |
| PA retenue et orientation | 150/92 - orange | | |
| FACE : score et interprétation | 4 - Consommation excessive probable : intervention brève | | |
| FACE : seuils femmes appliqués faute de genre | oui | | |
| CAST : score et interprétation | 3 - Trois réponses positives ou plus : proposer une consultation d’addictologie | | |
| Polymédication (> 10 traitements) | oui | | |
| Signalement CPAM (pas de médecin traitant) | oui | | |
| Dépistages à rappeler | Dépistage du cancer du col de l’utérus (si concerné) | | |
| Alertes rouges | CAST | | |

### C05 - 45-50 ans : Homme 49 ans : repères alcool dépassés, FACE 9, Fagerström 6, CAST 2, PA moyenne 140/85, IMC 25,0, risque élevé colorectal

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 49 | | |
| IMC et interprétation | 25,0 - Surpoids | | |
| PA retenue et orientation | 140/85 - orange | | |
| Repères alcool dépassés | oui | | |
| FACE : score et interprétation | 9 - Dépendance probable : proposer une consultation d’addictologie | | |
| Fagerström : score et interprétation | 6 - Dépendance forte | | |
| CAST : score et interprétation | 2 - Deux réponses positives : intervention brève | | |
| Dépistages à rappeler | Dépistage du cancer colorectal chez un patient à risque élevé/très élevé | | |
| Alertes rouges | FACE, Fagerström | | |
| Cases pré-remplies depuis l’autoquestionnaire | Alcool | | |

### C06 - 18-25 ans : Femme 18 ans le jour du RDV (borne basse) : ADRS seule, ADRS 4 (seuil), binge drinking déclaré

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 18 | | |
| Tranche | 18-25 | | |
| Échelles et tests proposés selon l’âge | ADRS | | |
| IMC et interprétation | 21,3 - Corpulence normale | | |
| PA retenue et orientation | 118/72 - aucune orientation | | |
| ADRS : score et interprétation | 4 - État de souffrance psychologique | | |
| Dépistages à rappeler | aucun | | |
| Alertes rouges | aucun | | |
| Cases pré-remplies depuis l’autoquestionnaire | Binge drinking | | |

### C07 - 18-25 ans : Homme 20 ans le jour du RDV : ADRS et HAD proposées, ADRS 7 (seuil), HAD A 8 et D 7 (seuils)

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 20 | | |
| Échelles et tests proposés selon l’âge | ADRS, HAD | | |
| ADRS : score et interprétation | 7 - État de dépression | | |
| HAD anxiété (A) | 8 - Symptomatologie douteuse | | |
| HAD dépression (D) | 7 - Absence de symptomatologie | | |
| Dépistages à rappeler | aucun | | |
| Alertes rouges | ADRS | | |

### C08 - 18-25 ans : Femme 25 ans le jour du RDV (borne haute) : dépistage du col, IMC 18,4, PA 140/80, CAST 1, tentative de suicide déclarée

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 25 | | |
| Échelles et tests proposés selon l’âge | HAD | | |
| IMC et interprétation | 18,4 - Insuffisance pondérale | | |
| PA retenue et orientation | 140/80 - orange | | |
| CAST : score et interprétation | 1 - Une réponse positive : information minimale sur les risques | | |
| HAD anxiété (A) | 0 - Absence de symptomatologie | | |
| HAD dépression (D) | 0 - Absence de symptomatologie | | |
| Dépistages à rappeler | Dépistage du cancer du col de l’utérus | | |
| Alertes rouges | aucun | | |
| Cases pré-remplies depuis l’autoquestionnaire | Antécédent de passage à l’acte | | |

### C09 - 18-25 ans : Homme 22 ans : FACE homme 4 (sous le seuil), Fagerström 0, protoxyde d’azote, PA 179/109 (sous l’urgence), idées suicidaires

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 22 | | |
| Échelles et tests proposés selon l’âge | HAD | | |
| PA retenue et orientation | 179/109 - orange | | |
| FACE : score et interprétation | 4 - Risque faible ou nul : renforcement des conduites favorables à la santé | | |
| Fagerström : score et interprétation | 0 - Pas de dépendance | | |
| Dépistages à rappeler | aucun | | |
| Alertes rouges | Idées suicidaires | | |
| Cases pré-remplies depuis l’autoquestionnaire | Idées suicidaires, Protoxyde d’azote/gaz hilarant | | |

### C10 - 18-25 ans : Femme 24 ans : FACE femme 3 (sous le seuil), HAD A 11 et D 10 (seuils), obésité

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 24 | | |
| IMC et interprétation | 30,5 - Obésité | | |
| FACE : score et interprétation | 3 - Risque faible ou nul : renforcement des conduites favorables à la santé | | |
| HAD anxiété (A) | 11 - Symptomatologie certaine | | |
| HAD dépression (D) | 10 - Symptomatologie douteuse | | |
| Dépistages à rappeler | aucun | | |
| Alertes rouges | HAD anxiété | | |

### C11 - 60-65 ans : Homme 60 ans le jour du RDV : pas de grille d’Amsler (> 60 ans), ICOPE entièrement normal

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 60 | | |
| Tranche | 60-65 | | |
| Échelles et tests proposés selon l’âge | HAD, ICOPE | | |
| IMC et interprétation | 22,9 - Corpulence normale | | |
| ICOPE : domaines positifs | aucun | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal | | |
| Alertes rouges | aucun | | |

### C12 - 60-65 ans : Femme 61 ans : grille d’Amsler anormale, ICOPE vision positive, levers de chaise en 13,9 s (normal), PA 160/100

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 61 | | |
| Échelles et tests proposés selon l’âge | Grille d’Amsler, HAD, ICOPE | | |
| PA retenue et orientation | 160/100 - orange | | |
| ICOPE : domaines positifs | Vision | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal, Mammographie de dépistage organisé du cancer du sein, Dépistage du cancer du col de l’utérus | | |
| Alertes rouges | Grille d’Amsler | | |

### C13 - 60-65 ans : Homme 63 ans : levers de chaise en 14 s (seuil), un mot non rappelé, PA 180/100, FACE homme 8 (seuil)

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 63 | | |
| PA retenue et orientation | 180/100 - rouge bloquante | | |
| FACE : score et interprétation | 8 - Consommation excessive probable : intervention brève | | |
| ICOPE : domaines positifs | Cognition, Mobilité | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal | | |
| Alertes rouges | Pression artérielle | | |

### C14 - 60-65 ans : Femme 65 ans le jour du RDV (borne haute) : 3 dépistages, HAD A 7 et D 8 (seuils), isolement déclaré, 10 traitements

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 65 | | |
| PA retenue et orientation | 135/85 - aucune orientation | | |
| HAD anxiété (A) | 7 - Absence de symptomatologie | | |
| HAD dépression (D) | 8 - Symptomatologie douteuse | | |
| Polymédication (> 10 traitements) | non | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal, Mammographie de dépistage organisé du cancer du sein, Dépistage du cancer du col de l’utérus | | |
| Alertes rouges | aucun | | |
| Cases pré-remplies depuis l’autoquestionnaire | Situation d’isolement | | |

### C15 - 60-65 ans : Homme 64 ans : risque élevé colorectal, PA diastolique 110 (urgence), idées suicidaires, obésité

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 64 | | |
| IMC et interprétation | 32,4 - Obésité | | |
| PA retenue et orientation | 130/110 - rouge bloquante | | |
| Dépistages à rappeler | Dépistage du cancer colorectal chez un patient à risque élevé/très élevé | | |
| Alertes rouges | Idées suicidaires, Pression artérielle | | |

### C16 - 70-75 ans : Femme 70 ans le jour du RDV : grands caractères, Amsler anormal, ICOPE audition positive, plus de dépistage du col

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 70 | | |
| Tranche | 70-75 | | |
| Thème d’affichage | contraste | | |
| Échelles et tests proposés selon l’âge | Grille d’Amsler, HAD, ICOPE | | |
| ICOPE : domaines positifs | Audition | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal, Mammographie de dépistage organisé du cancer du sein | | |
| Alertes rouges | Grille d’Amsler | | |

### C17 - 70-75 ans : Homme 75 ans le jour du RDV (borne haute) : plus de dépistage organisé, PA 150/85, FACE 9

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 75 | | |
| IMC et interprétation | 20,8 - Corpulence normale | | |
| PA retenue et orientation | 150/85 - orange | | |
| FACE : score et interprétation | 9 - Dépendance probable : proposer une consultation d’addictologie | | |
| ICOPE : domaines positifs | aucun | | |
| Dépistages à rappeler | aucun | | |
| Alertes rouges | FACE | | |

### C18 - 70-75 ans : Femme 72 ans : idées suicidaires (case hors fiche officielle), difficulté à marcher, logement non adapté aux chutes, ICOPE nutrition positive

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 72 | | |
| ICOPE : domaines positifs | Nutrition | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal, Mammographie de dépistage organisé du cancer du sein | | |
| Alertes rouges | Idées suicidaires | | |
| Cases pré-remplies depuis l’autoquestionnaire | Idées suicidaires, Perte d’autonomie/dépendance, La personne présente des risques, précisez | | |

### C19 - 70-75 ans : Genre non renseigné, 74 ans : dépistages « si concerné », FACE 4 avec seuils femmes, CAST 0, Fagerström 3

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 74 | | |
| FACE : score et interprétation | 4 - Consommation excessive probable : intervention brève | | |
| FACE : seuils femmes appliqués faute de genre | oui | | |
| CAST : score et interprétation | 0 - Aucune réponse positive | | |
| Fagerström : score et interprétation | 3 - Dépendance modérée | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal, Mammographie de dépistage organisé du cancer du sein (si concerné) | | |
| Alertes rouges | aucun | | |

### C20 - 70-75 ans : Homme 73 ans : PA sur deux bras (bras le plus sévère retenu), HAD D 11, polymédication, sans médecin traitant

| Élément | Résultat attendu (outil) | Identique au calcul manuel (oui / non) | Analyse de l’écart |
|---|---|---|---|
| Âge révolu au RDV | 73 | | |
| PA retenue et orientation | 181/95 - rouge bloquante | | |
| HAD anxiété (A) | 0 - Absence de symptomatologie | | |
| HAD dépression (D) | 11 - Symptomatologie certaine | | |
| Polymédication (> 10 traitements) | oui | | |
| Signalement CPAM (pas de médecin traitant) | oui | | |
| Dépistages à rappeler | Test de dépistage organisé du cancer colorectal | | |
| Alertes rouges | HAD dépression, Pression artérielle | | |

## Conclusion

| | |
|---|---|
| Nombre de cas rejoués | 20 |
| Nombre d’écarts constatés | |
| Écarts corrigés et rejoués | |
| Décision (mise en service autorisée / refusée) | |
| Nom du pharmacien référent | |
| Date | |
| Signature | |
