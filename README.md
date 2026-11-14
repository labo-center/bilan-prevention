# Copilote Mon Bilan Prévention

Micro-application (brique React) qui accompagne le pharmacien effecteur pendant le Bilan Prévention de l'Assurance Maladie : autoquestionnaire, fiche d'aide au repérage pré-remplie, scores et alertes, décision partagée, Plan Personnalisé de Prévention et export PDF. Aucune donnée patient n'est conservée.

## Contenu du dépôt
- `docs/PRD_copilote_bilan_prevention.md` : spécification complète et plan d'implémentation par incréments.
- `docs/sources/` : documents officiels Mon Bilan Prévention (seule source du contenu métier).
- `referentiels/*.json` : contenu métier versionné (tranches, tests, puis seuils et orientations), validé par Zod au démarrage.
- `src/logic/` : règles pures (sans React ni DOM), testées par vitest.
- `src/referentiels/` : schémas Zod et chargeur des référentiels.
- `src/data/` : `DataClient` (implémentation `memory` en v1, `flask` réservée à la v2).
- `src/ui/` : composants React (rendu uniquement). Styles : `src/styles/tokens.css` + CSS Modules.

## Lancer seul (développement)
```bash
npm install
npm run dev
```
Le harnais `index.html` + `src/main.tsx` monte la brique comme le ferait un shell hôte.

## Tests et contrôles
```bash
npm test          # vitest (logic, référentiels, UI)
npm run typecheck # TypeScript strict
npm run lint      # ESLint (no-console interdit)
npm run e2e       # build de l'application puis Playwright : un parcours par tranche, et une session hors ligne jusqu'à l'export PDF
npm run build     # bibliothèque dist/brick.js, react et react-dom externalisés
npm run build:app # application autonome dist-app/ : PWA hors ligne, CSP stricte
```

## Monter dans un shell hôte
```ts
import { manifest, mount, unmount } from 'copilote-bilan-prevention/dist/brick.js';
import 'copilote-bilan-prevention/dist/brick.css';

mount(document.getElementById('zone-brique')!, {
  config: { sourceDonnees: 'memory' },
  theme: 'clair', // ou 'contraste'
});
// ... à la sortie :
unmount(); // démonte React, purge les données de session, nettoie le conteneur
```
Le shell fournit `react` et `react-dom` (18.x). Tous les champs du contexte sont optionnels.

Le moteur PDF et les polices sont des fichiers séparés (`dist/react-pdf.browser-*.js`, `dist/polices-*.js`, `dist/DocumentBilan-*.js`), chargés seulement au premier export : les servir à côté de `brick.js`. La CSP de l'hôte doit autoriser `script-src 'wasm-unsafe-eval'`, `connect-src data: blob:` et `frame-src 'self'` (voir `docs/securite.md`).

Le build produit aussi `dist/fiches-thematiques.pdf` (fiches thématiques officielles), à servir à côté de la brique. Son adresse se règle avec `config.urlFichesThematiques` (par défaut `fiches-thematiques.pdf`, relative à la page).

## Application autonome (poste ou serveur local de l'officine)
`npm run build:app` produit `dist-app/`, à servir tel quel par n'importe quel serveur de fichiers statiques (chemins relatifs). Au premier chargement, le service worker met l'application, les polices et les fiches thématiques en cache : la suite fonctionne sans réseau. Le cache ne contient que des fichiers statiques, jamais de donnée de session.

## Référentiels
Chaque fichier de tranche (`AA-AA.json`) porte `version`, `dateValidation` (`null` tant que le pharmacien référent n'a pas validé) et des références de source (document + page). Un référentiel invalide bloque le démarrage et l'écran indique le fichier et le champ en erreur.

Les écarts entre PRD et sources, et les valeurs « à vérifier », sont tracés dans `docs/decisions_referentiels.md`.

## État
- Incrément 1 (socle) : structure de la brique, mount/unmount, ouverture de session et sélection de la tranche d'âge (M1), référentiel 45-50 validé par Zod (M16).
- Incrément 6 (autres tranches) : référentiels 18-25, 60-65 et 70-75 (autoquestionnaires, fiches, correspondances), ADRS, grille d'Amsler et ICOPE, thème grands caractères (d'office pour les 70-75 ans), un parcours Playwright par tranche.
- Incrément 5 (sortie et sécurité) : export PDF fiche + PPP avec version des référentiels et mention « INCOMPLET » (M14), opposition au médecin traitant, contrôle de facturation (S2), purge à la clôture et après 30 min d'inactivité (M15), minuteur d'entretien (S3), application hors ligne (S6), CSP stricte et checklist `docs/securite.md`.
- Incrément 4 (décision partagée et PPP) : matrice des risques et choix de 1 ou 2 priorités (M12), entretien motivationnel (S1), PPP pré-rempli depuis `referentiels/orientation.json` (M13), ajout d'office du bien-être mental en cas d'idées suicidaires (M10), fiches thématiques en panneau latéral (S5).
- Incrément 3 (saisie) : autoquestionnaire patient (M2), fiche de repérage pré-remplie (M3), tests cliniques avec scores et alertes (M4 à M11), liste des risques repérés triée, parcours Playwright.
- Incrément 2 (moteur de règles) : `referentiels/scores.json` et `src/logic/` (IMC, PA, repères alcool, FACE, Fagerström, CAST, ADRS, HAD, ICOPE, Amsler, polymédication, idées suicidaires, médecin traitant, dépistages, facturation).
