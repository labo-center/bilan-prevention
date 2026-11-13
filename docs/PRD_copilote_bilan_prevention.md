# PRD - Copilote Mon Bilan Prévention (effecteur pharmacien)

**Version** : 0.1 (draft)
**Auteur** : Dr HURMIC Olivier
**Date** : 2026-11-13
**Statut** : Brouillon
**Catégorie** : 1 - CRITIQUE (outil clinique d'aide au repérage, voir §1)

---

> 🚨 **ALERTES À ARBITRER AVANT DÉVELOPPEMENT**
>
> 1. **Périmètre hors "outil interne LBM"** : l'outil est destiné à un effecteur du Bilan Prévention (pharmacien d'officine en v1, puis médecin, infirmier, sage-femme). Tant qu'il reste utilisé par son concepteur dans une seule structure, il reste un outil interne. Dès qu'il est diffusé à d'autres professionnels ou à d'autres entités juridiques, il devient un **produit** : exigences de certification, dossier technique, support.
> 2. **Suspicion DM (Règlement UE 2017/745)** : l'outil calcule des scores de risque individuels (FACE, Fagerström, CAST, HAD, ADRS, ICOPE) et déclenche des alertes d'orientation (PA ≥ 180/110 mmHg → urgences). C'est typiquement un logiciel d'aide à la décision médicale individuelle, donc **qualification DM probable (classe IIa probable)**. Mesure de réduction de risque retenue en v1 : l'outil restitue les grilles officielles et leurs seuils **tels que publiés** dans le livret Mon Bilan Prévention, sans interprétation nouvelle, et le professionnel valide chaque conclusion. Cette mesure **ne suffit pas à elle seule** à sortir du champ DM. Qualification à confirmer par un référent réglementaire DM avant toute diffusion hors usage personnel.
> 3. **Données de santé identifiantes** : nom, prénom, antécédents, consommations, santé mentale, violences. RGPD art. 9 + AIPD + HDS si hébergement par un tiers. Choix v1 : **aucune persistance serveur, aucun cloud**.

---

## 1. CONTEXTE MÉTIER

- **Processus** : réalisation du Bilan Prévention (dispositif "Mon Bilan Prévention", Assurance Maladie / ministère de la Santé), destiné aux assurés de 18-25, 45-50, 60-65 et 70-75 ans (bornes incluses). C'est un entretien de 30 à 45 minutes, rémunéré 30 € (code acte pharmacien **RDP**), facturable une fois par personne et par tranche d'âge.
- **Workflow officiel en 3 étapes** (livret de présentation) : (1) repérage des risques individuels + court examen clinique, (2) priorisation partagée de 1 ou 2 sujets avec une approche motivationnelle, (3) rédaction partagée du Plan Personnalisé de Prévention (PPP), puis transmission au médecin traitant (DMP ou MSSanté) sauf opposition du patient.
- **Amont** : un autoquestionnaire facultatif d'environ 40 questions, rempli dans Mon espace santé ou sur papier.
- **État actuel** : supports PDF/papier (autoquestionnaire, fiche d'aide au repérage, PPP, 17 fiches thématiques, kit d'orientation en annexe VI du livret). Report manuel des réponses, calcul des scores à la main, recherche manuelle des ressources d'aval.
- **Volumétrie** : quelques bilans par semaine et par officine (hypothèse HYP1).
- **Catégorie retenue** : Cat 1 (influence une décision d'orientation individuelle), avec une composante Cat 5 (contrôle de facturation). Niveau retenu : **Cat 1**.

## 2. PROBLÈME À RÉSOUDRE

**Douleur principale** :
> Le pharmacien passe une part importante des 30-45 minutes du bilan à reporter, calculer et chercher des informations au lieu de mener l'entretien motivationnel, qui est le cœur du dispositif.

**Manifestations concrètes** :
- Report manuel des réponses de l'autoquestionnaire dans la fiche d'aide au repérage.
- Calcul manuel des scores (FACE, Fagerström, CAST, HAD/ADRS, ICOPE) avec risque d'erreur de seuil (seuils différents selon le sexe pour FACE).
- Choix de la bonne fiche selon la tranche d'âge et des tests applicables, sans rappel automatique (Amsler seulement après 60 ans, ICOPE seulement à 60-65 et 70-75 ans).
- Recherche des orientations d'aval dans le tableau de l'annexe VI, qui mélange les 4 types d'effecteurs.
- PPP rédigé à la main, transmission au médecin traitant faite au cas par cas.

**Coût du statu quo** :
- Temps : estimé à 10-15 min de tâches administratives par bilan (HYP2).
- Risque : seuil d'alerte manqué (PA ≥ 180/110, Amsler anormal, idées suicidaires), dépistage organisé non proposé, double facturation RDP sur une même tranche d'âge.
- Conformité : PPP non transmis au médecin traitant, opposition du patient non tracée.

## 3. UTILISATEURS CIBLES

| Profil | Fréquence d'usage | Besoin principal | Niveau technique |
|---|---|---|---|
| Pharmacien effecteur | Plusieurs bilans/semaine | Mener l'entretien sans paperasse, ne rater aucune alerte | Moyen |
| Préparateur / assistant | Avant le RDV | Aider le patient à remplir l'autoquestionnaire sur tablette | Faible |
| Patient | 1 fois par tranche d'âge | Remplir le questionnaire, co-rédiger son PPP | Variable, parfois faible (70-75 ans) |
| Médecin traitant (destinataire) | À réception | Lire le PPP et la fiche de repérage | Lecteur de PDF seulement |

**Utilisateur primaire** : pharmacien effecteur.
**Utilisateurs secondaires** : assistant (saisie amont), patient (saisie et co-rédaction), médecin traitant (lecture seule du PDF, hors application).

## 4. SCOPE / HORS-SCOPE

### Dans le scope (v1)
- Sélection de la tranche d'âge à partir de la date de naissance, avec blocage hors tranche.
- Saisie de l'autoquestionnaire par le patient sur tablette ou par le pharmacien à partir de la version papier.
- Fiche d'aide au repérage pré-remplie à partir de l'autoquestionnaire.
- Tests cliniques avec score calculé et interprétation selon les grilles du livret.
- Alertes d'orientation (seuils du livret et du kit d'orientation).
- Matrice des risques + sélection de 1 à 2 priorités (décision partagée).
- Assistant d'entretien motivationnel (stade de changement, balance décisionnelle, questions ouvertes).
- PPP pré-rempli à 4 colonnes, modifiable.
- Kit d'orientation filtré pour l'effecteur pharmacien.
- Export PDF de la fiche de repérage et du PPP (case d'opposition à la transmission au médecin traitant).
- Contrôle de facturation (RDP + au plus 1 acte complémentaire autorisé).
- **Tranche 45-50 ans en premier** (incréments 1 à 5), puis les 3 autres (incrément 6).

### Hors scope (explicite)
- Envoi MSSanté et dépôt DMP - *pourquoi : nécessite une homologation Ségur / un connecteur LGO, prévu en v2.*
- Import direct depuis Mon espace santé - *pourquoi : pas d'API ouverte connue pour les effecteurs (HYP4).*
- Télétransmission de la facture - *pourquoi : relève du LGO.*
- Stockage d'un historique patient - *pourquoi : minimisation RGPD, le dossier vit dans le LGO et le DMP.*
- Prise de rendez-vous - *pourquoi : relève de l'agenda en ligne existant.*

### Évolutions envisagées (v2+)
- Backend local Flask : authentification, journal d'audit, brouillons chiffrés.
- Export vers DMP / MSSanté via le LGO ou un connecteur homologué.
- OCR de l'autoquestionnaire papier (réutilisation du pipeline OCR_ORDO).
- Reformulation du PPP en langage patient via un LLM local (Ollama), en brouillon soumis à validation.
- Mode multi-effecteurs (médecin, IDE, sage-femme) : kit d'orientation et actes complémentaires propres à chacun.

## 5. FONCTIONNALITÉS PRIORITAIRES (MoSCoW)

### MUST HAVE
| ID | Fonctionnalité | Description | Critère d'acceptation |
|---|---|---|---|
| M1 | Sélection tranche d'âge | Calcule l'âge à la date du RDV et charge le référentiel de la tranche | Quand la date de naissance donne 47 ans, alors le référentiel `45-50` est chargé. Quand l'âge est 51 ans, alors un message bloquant "Hors tranche Bilan Prévention" s'affiche et aucune fiche n'est ouverte. |
| M2 | Autoquestionnaire | Formulaire patient (tablette), aucune question obligatoire, gros caractères | Quand le patient valide avec 0 réponse, alors la session reste valide. Les libellés affichés sont identiques au PDF officiel de la tranche. |
| M3 | Pré-remplissage fiche repérage | Mapping réponses autoquestionnaire → champs fiche | Quand le patient répond "Oui" à "Rôle d'aidant", alors la case "Rôle d'aidant" de la fiche est cochée et marquée "Déclaré par le patient". |
| M4 | IMC | IMC = poids (kg) / taille (m)², arrondi à 0,1 | Quand taille = 1,75 m et poids = 80 kg, alors IMC affiché = 26,1. Quand taille est vide, alors IMC = "non calculable", sans erreur. |
| M5 | Pression artérielle | Saisie d'au moins 2 mesures, retient la plus haute moyenne (voir §6.2) | Quand PA retenue = 145/85, alors message orange "Orienter vers le médecin traitant pour confirmation". Quand PA = 182/100, alors **alerte rouge bloquante** "Orienter vers les urgences" à acquitter pour continuer. |
| M6 | Score FACE | 5 questions, score 0-20, seuils par sexe | Quand homme, score 6, alors "Consommation excessive probable - intervention brève". Quand femme, score 4, alors même message. Quand score 9, alors "Dépendance probable - proposer une consultation d'addictologie". |
| M7 | Fagerström simplifié | 2 questions, score 0-6 | Quand 15 cig/j (1) et première cigarette à 10 min (2), alors score 3 "dépendance modérée". |
| M8 | CAST | 6 questions oui/non | Quand 2 "oui", alors "Intervention brève". Quand 3 "oui", alors "Proposer une consultation d'addictologie". |
| M9 | HAD | 14 items 0-3, scores A et D séparés | Quand total A = 9, alors "symptomatologie anxieuse douteuse". Quand total D = 12, alors "symptomatologie dépressive certaine". |
| M10 | Alerte idées suicidaires | Case "Idées suicidaires" de la fiche | Quand la case est cochée, alors un bandeau rouge affiche le 3114 et l'orientation "Bien-être mental et social" est ajoutée d'office aux ressources du PPP. |
| M11 | Dépistages organisés | Rappel selon âge et sexe (§6.2) | Quand femme 48 ans, alors le rappel "Dépistage du cancer du col de l'utérus" s'affiche, et "sein" et "colorectal" sont masqués. Quand homme ou femme 50-74 ans, alors "colorectal" s'affiche. |
| M12 | Matrice des risques | Liste des risques repérés, triés par gravité (rouge, orange, info) | Quand 5 risques sont repérés, alors ils s'affichent triés rouge > orange > info. Le pharmacien ne peut pas sélectionner plus de 2 priorités. |
| M13 | PPP | 4 colonnes (priorités, freins, conseils et modalités, ressources) + modalités de suivi | Quand la priorité "Tabac" est sélectionnée, alors la colonne "Ressources" est pré-remplie avec les ressources pharmacien du kit (Tabac Info Service 3989, CSAPA, substituts nicotiniques). Chaque cellule reste modifiable. |
| M14 | Export PDF | Fiche de repérage + PPP au format A4, version du référentiel en pied de page | Quand l'export est lancé, alors 1 PDF de 2 sections est téléchargé, avec "Référentiel MBP v{x.y} - {date}" en pied de page. Si l'opposition est cochée, alors la mention "Le patient s'oppose à la transmission au médecin traitant" apparaît sur le PPP. |
| M15 | Purge de session | Aucune donnée persistée après la clôture | Quand la session est clôturée ou inactive depuis 30 min, alors `sessionStorage`, `localStorage` et la mémoire de l'application ne contiennent plus aucune donnée patient (vérifié par un test). |
| M16 | Référentiels versionnés | Questionnaires, seuils et orientations dans des fichiers JSON versionnés, validés par Zod au chargement | Quand un fichier de référentiel est invalide, alors l'application refuse de démarrer et affiche le chemin et le champ en erreur. |

### SHOULD HAVE
| ID | Fonctionnalité | Description | Critère d'acceptation |
|---|---|---|---|
| S1 | Assistant motivationnel | Stade de changement (6 stades HAS) + balance décisionnelle + questions ouvertes | Quand le stade "Intention" est choisi, alors la balance décisionnelle s'affiche avec 4 cases (avantages/inconvénients à changer/à ne pas changer). |
| S2 | Contrôle facturation | Rappel RDP + 1 seul acte en plus (RVA ou remise du kit DOCCR) | Quand RVA et remise du kit DOCCR sont cochés ensemble, alors un message bloquant indique "1 seul acte complémentaire facturable par Bilan Prévention". |
| S3 | Minuteur d'entretien | Chrono visible, repère à 30 et 45 min | Quand 45 min sont écoulées, alors le chrono passe en orange sans interrompre la saisie. |
| S4 | Absence de médecin traitant | Aide à la démarche | Quand "Médecin traitant : Non", alors une case "Accord du patient pour signaler la situation à la CPAM" et la fiche "Accès aux droits" s'affichent. |
| S5 | Fiches thématiques | Accès en 1 clic à la fiche thématique liée à chaque risque | Quand le risque "Sommeil" est sélectionné, alors la fiche "Sommeil" s'ouvre en panneau latéral sans quitter la session. |
| S6 | Mode hors ligne | PWA, fonctionnement sans réseau | Quand le réseau est coupé, alors une session complète jusqu'à l'export PDF fonctionne. |

### COULD HAVE
| ID | Fonctionnalité | Description |
|---|---|---|
| C1 | QR code salle d'attente | Le patient remplit l'autoquestionnaire sur son smartphone, transfert par code court, sans stockage serveur |
| C2 | Statistiques anonymes | Compteur local de bilans réalisés par tranche, sans aucune donnée patient |
| C3 | Thème contrasté | Thème grands caractères pour les 70-75 ans |

### WON'T HAVE (v1)
- Envoi DMP / MSSanté, import Mon espace santé, IA générative, stockage d'historique patient, multi-effecteurs.

## 6. SPÉCIFICATIONS TECHNIQUES

### 6.1 Entrées
| Source | Format | Fréquence | Volumétrie | Exemple |
|---|---|---|---|---|
| Saisie patient (autoquestionnaire) | Formulaire web | Par bilan | ~40 champs | Q4 "Rôle d'aidant" = Oui |
| Saisie pharmacien (fiche + tests) | Formulaire web | Par bilan | ~80 champs | PA 145/85, FACE Q1 = 3 |
| Référentiels tranche d'âge | JSON versionné dans le repo | À chaque mise à jour AMELI/HAS | 4 fichiers, < 100 Ko chacun | `referentiels/45-50.json` |
| Référentiel scores | JSON versionné | Idem | 1 fichier | `referentiels/scores.json` |
| Kit d'orientation | JSON versionné | Idem | 1 fichier, ~15 thématiques × 4 effecteurs | `referentiels/orientation.json` |
| Fiches thématiques | PDF officiel (17 fiches) | Idem | 1 PDF | lien interne + page |

Sources officielles à transcrire (fournies dans le projet) : livret de présentation, 4 autoquestionnaires, 4 fiches d'aide au repérage, 4 PPP, fiches thématiques synthétiques.

### 6.2 Traitements

**Étape 1 - Ouverture de session** : date du RDV, date de naissance, sexe (H / F / Autre / ne souhaite pas répondre). Calcul de la tranche (bornes incluses).

**Étape 2 - Autoquestionnaire puis pré-remplissage** de la fiche via la table de correspondance `mapping` du référentiel. Chaque champ porte une origine : `declare_patient` ou `saisi_professionnel`.

**Étape 3 - Tests applicables par tranche** (livret §2.2.1) :

| Test | 18-25 | 45-50 | 60-65 | 70-75 |
|---|---|---|---|---|
| Poids, taille, IMC | X | X | X | X |
| Acuité visuelle (Monoyer) | X | X | X | X |
| Grille d'Amsler | | | X | X |
| Voix chuchotée | X | X | X | X |
| Pression artérielle | X | X | X | X |
| ICOPE étape 1 | | | X | X |
| Spirométrie / débit expiratoire de pointe | [colonnes à vérifier sur le livret original] | | | |
| FACE, Fagerström, CAST | X | X | X | X |
| ADRS (18-20 ans) / HAD (≥ 20 ans) | X | X | X | X |
| PHQ-4 (cité dans la fiche 45-50) | | X | | |

**Règles métier critiques** (source : livret Mon Bilan Prévention, annexes III et VI ; toutes stockées dans `scores.json`, jamais en dur dans le code) :

| Règle | Calcul | Interprétation |
|---|---|---|
| IMC | poids / taille² | Seuils OMS adulte et seuil dénutrition ≥ 70 ans : **[référentiel à vérifier, non fourni dans le livret]** |
| PA | ≥ 2 mesures, au repos 3-5 min ; 1re fois aux 2 bras, retenir le bras le plus haut | ≥ 140/90 → orienter vers le médecin traitant pour confirmation ; ≥ 180/110 → urgences (alerte bloquante). Seuil appliqué si systolique OU diastolique dépasse. |
| FACE | Q1 0-4, Q2 0-4, Q3/Q4/Q5 0 ou 4 | H < 5 / F < 4 : risque faible ; H 5-8 / F 4-8 : consommation excessive probable, intervention brève ; > 8 : dépendance probable, consultation d'addictologie. Sexe "Autre" ou non renseigné : appliquer le seuil le plus protecteur (F) et l'afficher. |
| Repères alcool | > 10 verres/semaine OU > 2 verres/jour OU < 2 jours sans alcool/semaine | Consommation à risque |
| Fagerström simplifié | cig/j : ≤ 10 = 0, 11-20 = 1, 21-30 = 2, ≥ 31 = 3 ; délai 1re cigarette : < 5 min = 3, 6-30 = 2, 31-60 = 1, > 60 = 0 | 0-1 pas de dépendance ; 2-3 modérée ; 4-6 forte |
| CAST | 6 items oui/non | 1 oui : information minimale ; 2 : intervention brève ; ≥ 3 : consultation d'addictologie |
| ADRS (18-20 ans) | 10 items vrai/faux, score = nombre de "vrai" | 0-3 absence ; ≥ 4 souffrance psychologique ; ≥ 7 état de dépression |
| HAD (≥ 20 ans) | 14 items 0-3 ; A = items impairs, D = items pairs | ≤ 7 absence ; 8-10 douteuse ; ≥ 11 certaine (pour A et D séparément) |
| PHQ-4 | 4 items 0-3 | Seuils **[référentiel à vérifier]** |
| ICOPE étape 1 | 6 domaines (cognition, nutrition, vision, audition, psychologie, mobilité) | Domaine positif si : rappel 3 mots incomplet ou orientation erronée ; perte ≥ 3 kg en 3 mois ou perte d'appétit ; plainte visuelle ; whisper échoué à une oreille ; 1 réponse "oui" aux 2 questions de thymie ; 5 levers de chaise ≥ 14 s ou non réalisés. Tout domaine positif → orientation médecin traitant. |
| Amsler (> 60 ans) | Lignes déformées ou taches | Orientation ophtalmologue en moins d'1 semaine (alerte rouge) |
| Polymédication | > 10 traitements | Informer le médecin traitant |
| Idées suicidaires | Case cochée | Alerte rouge, 3114, orientation bien-être mental |
| Dépistages organisés | Âge + sexe | Colorectal 50-74 ans (test de dépistage organisé) ; sein F 50-74 ans (mammographie tous les 2 ans) ; col de l'utérus F 25-65 ans ; risque élevé ou très élevé déclaré → orientation médecin / spécialiste |
| Médecin traitant absent | "Non" | Proposer, avec l'accord du patient, le signalement à la CPAM |
| Facturation | RDP 30 €, 1 fois par tranche | + au plus 1 acte parmi : RVA (vaccination), remise du kit DOCCR |

**Étape 4 - Matrice des risques** : chaque règle déclenchée produit un objet `Risque { theme, niveau: 'rouge'|'orange'|'info', source, message, ficheThematique }`. Tri rouge > orange > info. Sélection de 1 à 2 priorités par le pharmacien et le patient.

**Étape 5 - PPP** : pour chaque priorité, pré-remplissage depuis `orientation.json` (effecteur = pharmacien) ; colonnes "freins" et "conseils" vides par défaut, avec des suggestions issues de la fiche thématique liée, cliquables.

**Étape 6 - Export et purge** : génération du PDF côté navigateur, puis purge (M15).

**Versionning des règles** : chaque JSON de référentiel porte `version`, `source` (document + page) et `dateValidation`. Toute modification passe par une revue Git et est validée par un pharmacien référent (HYP5). Le PDF affiche la version.

### 6.3 Sorties
| Livrable | Format | Destinataire | Conservation |
|---|---|---|---|
| Fiche d'aide au repérage complétée | PDF A4 | Pharmacien (dossier LGO), médecin traitant | Dans le LGO / DMP, hors application |
| PPP | PDF A4 | Patient (exemplaire), médecin traitant sauf opposition | Idem |
| Récapitulatif facturation | Encart écran | Pharmacien | Non conservé |
| Données de session | Mémoire du navigateur | - | Purgées à la clôture ou après 30 min d'inactivité |

### 6.4 Stack technique recommandée

Architecture **brique React** (Cas G), car l'outil est une micro-application de saisie interactive.

| Couche | Choix |
|---|---|
| Front | React 18 + TypeScript strict + Vite, PWA (vite-plugin-pwa) |
| État | useState / Zustand pour la session ; TanStack Query non requis en v1 (pas d'appel serveur) |
| Formulaires | React Hook Form + Zod (Zod valide aussi les référentiels JSON) |
| Primitives | Radix UI |
| Styles | tokens.css + CSS Modules, **pas de Tailwind** |
| PDF | `@react-pdf/renderer` (génération côté client, aucune donnée envoyée) |
| Tests | vitest (logic/), Playwright (1 parcours de bout en bout) |
| Back | **Aucun en v1** (écart justifié : zéro persistance = zéro surface HDS). Flask local en v2 pour l'authentification et le journal d'audit. |
| Données | `DataClient` avec 2 implémentations : `memory` (v1) et `flask` (v2), choisies par la config |
| IA | Aucune en v1 |
| Hébergement | Fichiers statiques servis depuis le poste ou un serveur local de l'officine (ou GitHub Pages, puisque aucune donnée ne quitte le navigateur, HYP6) |

### 6.5 Plan d'implémentation incrémental
- **Incrément 1 - Socle** : arborescence de la brique (§11), tokens.css, `brick.tsx` (mount/unmount), harnais dev, écran d'ouverture de session (M1), chargement et validation Zod de `45-50.json` (M16). *Vérifiable : 47 ans charge la fiche, 51 ans bloque, JSON corrompu bloque le démarrage.*
- **Incrément 2 - Moteur de règles** : `logic/` pur (IMC, PA, FACE, Fagerström, CAST, HAD, ADRS, ICOPE, dépistages, facturation), piloté par `scores.json`. *Vérifiable : ≥ 1 test vitest par règle, dont tous les cas limites des seuils (4/5 FACE, 7/8 et 10/11 HAD, 139/140 et 179/180 PA, 13,9/14 s levers de chaise).*
- **Incrément 3 - Saisie** : autoquestionnaire patient (M2), fiche de repérage pré-remplie (M3), tests cliniques (M4 à M11) avec alertes. *Vérifiable : un parcours Playwright 45-50 ans de bout en bout jusqu'à la matrice des risques.*
- **Incrément 4 - Décision partagée et PPP** : matrice des risques (M12), assistant motivationnel (S1), PPP pré-rempli depuis `orientation.json` (M13), fiches thématiques (S5). *Vérifiable : priorité "Tabac" pré-remplit 3989 + CSAPA + substituts nicotiniques.*
- **Incrément 5 - Sortie et sécurité** : export PDF (M14), opposition au médecin traitant, contrôle de facturation (S2), purge (M15), minuteur (S3), PWA hors ligne (S6). *Vérifiable : après la clôture, aucune donnée patient dans le stockage du navigateur.*
- **Incrément 6 - Autres tranches** : référentiels 18-25, 60-65, 70-75 (ADRS, Amsler, ICOPE, thème grands caractères). *Vérifiable : un parcours Playwright par tranche.*
- **Incrément 7 (v2)** : backend Flask local (authentification, journal d'audit sans données de santé), puis étude du connecteur DMP / MSSanté.

## 7. CONTRAINTES

### 7.1 Réglementaires / normatives
- [ ] **Règlement DM (UE) 2017/745** : qualification à confirmer (voir l'alerte en tête). Statut visé en v1 : usage interne par son concepteur, restitution fidèle des grilles publiées. Toute diffusion à un tiers est conditionnée à l'avis d'un référent DM (exemption in-house non transposable telle quelle à une officine : [à vérifier]).
- [ ] **RGPD art. 9** : données de santé. Base légale à confirmer avec un DPO (HYP7). Minimisation : aucune donnée conservée par l'application. Registre des traitements de l'officine à mettre à jour. **AIPD probablement requise** (données de santé + personnes potentiellement vulnérables).
- [ ] **HDS** : non applicable en v1 (aucun hébergement de données par un tiers). Devient obligatoire si un backend distant stocke des données (v2).
- [ ] **PGSSI-S (ANS)** : bonnes pratiques de sécurité appliquées au poste et à la tablette (verrouillage, session courte).
- [ ] **Traçabilité** : la version du référentiel est inscrite dans chaque PDF ; journal des actions prévu en v2 (backend).
- [ ] **Versioning** : code et référentiels sous Git, tag de version à chaque modification de seuil, validation par le pharmacien référent.
- [ ] **Validation initiale** : rejeu de 20 cas tests calculés à la main avant la mise en service, revalidation à chaque changement de référentiel (§9).
- [ ] **Sources officielles** : aucun seuil n'est inventé. Un seuil absent des documents officiels est marqué `aVerifier: true` dans le JSON et affiché comme tel à l'écran.

### 7.2 SI / Infrastructure
- Environnement : navigateur récent (Chrome/Edge/Safari) sur poste de l'officine et tablette.
- Intégrations : aucune en v1 (le PDF est déposé dans le LGO à la main).
- Authentification : aucune en v1 (poste et tablette déjà protégés par la session de l'officine) ; authentification Flask en v2.
- Réseau : fonctionnement hors ligne après le premier chargement.

### 7.3 Données
- Sensibilité : identifiantes, de santé.
- Hébergement : uniquement en mémoire du navigateur pendant la session.
- Sauvegarde : N/A (pas de persistance). Le PDF exporté devient la seule trace et suit le circuit du LGO / DMP.
- Logs : aucun log contenant des données patient ; `console.log` interdit sur les données de session (règle de lint).

### 7.4 Performance
- Calcul d'un score : < 100 ms après la dernière réponse.
- Génération du PDF : < 3 s sur une tablette d'entrée de gamme.
- Chargement initial : < 3 s ; hors ligne ensuite.
- Disponibilité : pendant les heures d'ouverture, sans dépendance réseau.

## 8. CRITÈRES D'ACCEPTATION GLOBAUX
- [ ] Toutes les fonctions MUST HAVE passent leurs critères d'acceptation.
- [ ] Code et référentiels versionnés (Git), README (lancer seul en mode dev, monter dans un shell).
- [ ] Jeu de 20 cas tests (au moins 5 par tranche) avec résultats attendus calculés à la main et validés par un pharmacien.
- [ ] Cas limites des seuils couverts par des tests vitest.
- [ ] Guide utilisateur de 2 pages.
- [ ] Dossier de validation initiale : cas tests, résultats, écarts, signature du valideur.
- [ ] Aucun crash silencieux : toute erreur affiche un message explicite ; un PDF généré avec un champ obligatoire de calcul manquant porte la mention "INCOMPLET".
- [ ] **Definition of Done de la brique** :
  - [ ] tourne seule (`npm run dev`) et se monte/démonte via mount/unmount sans fuite ;
  - [ ] thème changé sans toucher à un composant React ;
  - [ ] source de données basculée par config sans toucher à `logic/` ni `ui/` ;
  - [ ] `logic/` testé sans navigateur (vitest) ;
  - [ ] react/react-dom externalisés au build ;
  - [ ] checklist de sécurité traitée (CSP stricte, aucun secret au front, aucune donnée sensible dans les logs, purge vérifiée).

## 9. PLAN DE DÉPLOIEMENT
- **Phase 1 - Développement** (incréments 1 à 5, tranche 45-50) : environ 3 à 4 semaines en vibe coding. Livrable : brique + tests + 20 cas.
- **Phase 2 - Validation** : rejeu des 20 cas par un pharmacien, comparaison avec le calcul manuel, dossier de validation signé. Écart toléré : 0 sur les scores et les alertes.
- **Phase 3 - Pilote** : 10 bilans réels dans une officine, en double saisie papier sur les 3 premiers. Indicateurs : temps administratif par bilan, alertes manquées (cible : 0), satisfaction du pharmacien.
- **Phase 4 - Mise en production** : extension aux 4 tranches (incrément 6), guide utilisateur, procédure de mise à jour des référentiels.
- **Phase 5 - Maintenance** : veille trimestrielle sur les publications Mon Bilan Prévention / HAS, revalidation des cas tests à chaque modification de référentiel, responsable nommé (HYP5).

## 10. HYPOTHÈSES ET ZONES GRISES
- HYP1 : volumétrie de 2 à 10 bilans par semaine et par officine - à confirmer par le pharmacien titulaire pilote.
- HYP2 : 10-15 min de tâches administratives par bilan aujourd'hui - à mesurer sur 3 bilans papier avant le pilote, par le pharmacien pilote.
- HYP3 : la répartition par tranche d'âge des tests spirométrie / débit de pointe et ADRS / HAD n'est pas lisible sans ambiguïté dans l'extraction texte du livret - à vérifier sur le PDF original par Dr HURMIC.
- HYP4 : pas d'API Mon espace santé ouverte aux effecteurs pour récupérer l'autoquestionnaire - à vérifier auprès de l'ANS / CNAM par Dr HURMIC.
- HYP5 : un pharmacien référent valide chaque version des référentiels - nom à désigner par le titulaire de l'officine.
- HYP6 : un hébergement statique public (GitHub Pages) est acceptable puisque aucune donnée ne quitte le navigateur - à confirmer par le DPO.
- HYP7 : base légale du traitement et nécessité d'une AIPD - à trancher par le DPO.
- HYP8 : qualification DM et conditions d'usage hors concepteur - à trancher par un référent réglementaire DM avant toute diffusion.
- HYP9 : seuils IMC (adulte et dénutrition ≥ 70 ans) et PHQ-4 absents des documents fournis - à sourcer (HAS) et valider par le pharmacien référent.

## 11. ANNEXES

### A. Arborescence de la brique
```
dashboard-bilan-prevention/
  vite.config.ts            (lib mode, react/react-dom external)
  index.html                (harnais dev)
  referentiels/
    18-25.json  45-50.json  60-65.json  70-75.json
    scores.json  orientation.json
  src/
    manifest.ts  brick.tsx  main.tsx  config.ts  context.tsx
    logic/        (règles pures : imc.ts, pa.ts, face.ts, fagerstrom.ts, cast.ts, had.ts, adrs.ts, icope.ts, depistages.ts, facturation.ts, risques.ts)
    logic/__tests__/
    data/         (DataClient, memoryClient.ts, flaskClient.ts (v2), factory.ts)
    referentiels/ (schémas Zod + loader)
    ui/           (Session, Autoquestionnaire, FicheReperage, Tests, MatriceRisques, Motivation, PPP, Export)
    pdf/          (FicheReperagePdf.tsx, PppPdf.tsx)
    styles/       (tokens.css + *.module.css)
```

### B. Extrait de format de référentiel (`scores.json`)
```json
{
  "version": "1.0.0",
  "source": "Livret Mon Bilan Prévention, annexe III",
  "dateValidation": "AAAA-MM-JJ",
  "face": {
    "items": [
      { "id": "q1", "options": [0, 1, 2, 3, 4] },
      { "id": "q2", "options": [0, 1, 2, 3, 4] },
      { "id": "q3", "options": [0, 4] },
      { "id": "q4", "options": [0, 4] },
      { "id": "q5", "options": [0, 4] }
    ],
    "seuils": {
      "H": [ { "max": 4, "niveau": "info", "message": "Risque faible ou nul" },
             { "max": 8, "niveau": "orange", "message": "Consommation excessive probable : intervention brève" },
             { "max": 20, "niveau": "rouge", "message": "Dépendance probable : proposer une consultation d'addictologie" } ],
      "F": [ { "max": 3, "niveau": "info", "message": "Risque faible ou nul" },
             { "max": 8, "niveau": "orange", "message": "Consommation excessive probable : intervention brève" },
             { "max": 20, "niveau": "rouge", "message": "Dépendance probable : proposer une consultation d'addictologie" } ]
    }
  }
}
```

### C. Références
- Livret de présentation Mon Bilan Prévention (annexes I à VI).
- Autoquestionnaires, fiches d'aide au repérage des risques et PPP des 4 tranches d'âge.
- 17 fiches thématiques synthétiques Mon Bilan Prévention.

### D. PROMPT DE BRIQUE (à coller dans Claude Code)

```
Tu es développeur d'outils de santé. Tu construis une BRIQUE React autonome,
utilisable seule ou recompilable dans un shell hôte. Lis d'abord le PRD complet
(PRD_copilote_bilan_prevention.md) et les PDF officiels Mon Bilan Prévention fournis.

# 1. CAS D'USAGE
Copilote du Bilan Prévention (Assurance Maladie) pour un pharmacien effecteur.
Parcours : ouverture de session (tranche d'âge 18-25 / 45-50 / 60-65 / 70-75) ->
autoquestionnaire patient -> fiche d'aide au repérage pré-remplie -> tests cliniques
avec scores et alertes (IMC, PA, FACE, Fagerström, CAST, HAD/ADRS, ICOPE, Amsler,
dépistages organisés) -> matrice des risques -> 1 à 2 priorités partagées +
assistant motivationnel -> PPP 4 colonnes pré-rempli depuis le kit d'orientation
pharmacien -> export PDF -> purge. v1 = tranche 45-50 uniquement.

# 2. DONNÉES
Données de santé identifiantes, JAMAIS persistées : mémoire du navigateur
uniquement, purge à la clôture ou après 30 min d'inactivité. Aucun appel réseau
contenant une donnée patient. Aucun console.log de données de session.
Toutes les questions, seuils, messages et orientations viennent de fichiers JSON
versionnés (referentiels/*.json) validés par Zod au démarrage ; AUCUN seuil en dur
dans le code. Un seuil non sourcé porte "aVerifier": true et s'affiche comme tel.

# 3. IA
Aucune en v1.

# 4. STACK
React 18 + TypeScript strict + Vite + PWA ; React Hook Form + Zod ; Radix UI ;
tokens.css + CSS Modules (PAS de Tailwind) ; @react-pdf/renderer côté client ;
vitest + Playwright. Pas de backend en v1 ; DataClient avec implémentation
"memory" (v1) et "flask" (v2), choisie par config.

# 5. CONTRAT DE BRIQUE (NON NÉGOCIABLE)
- Frontière : export { manifest } ; mount(container, ctx) ; unmount() avec cleanup
  complet (listeners, timers, données de session). ctx = { config, data, ai, user, theme }.
  react/react-dom externalisés au build (lib mode).
- Structure : celle de l'annexe A du PRD.
- logic/ = fonctions pures sans React ni DOM, testées par vitest, y compris
  tous les cas limites de seuils listés en §6.5 incrément 2.
- ui/ ne fait que du rendu et consomme logic/.
- Style 100 % via tokens.css + CSS Modules, aucune valeur de style en dur dans le JSX.
- Sécurité : CSP stricte, aucun secret au front, purge vérifiée par un test,
  aucune donnée sensible dans les logs.

# 6. LIVRABLES
Arborescence conforme, README (lancer seul / monter dans un shell), référentiel
45-50 complet, ≥ 1 test vitest par règle, 1 test Playwright de bout en bout,
checklist sécurité cochée.

# 7. DEFINITION OF DONE
Section 8 du PRD. Travaille incrément par incrément (§6.5) ; à la fin de chaque
incrément, lance les tests et montre le résultat avant de passer au suivant.
```

Colle ce prompt dans Claude Code et demande l'incrément 1 (socle : structure + mount/unmount + sélection de tranche + chargement du référentiel 45-50 validé par Zod).
