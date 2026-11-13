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
npm run build     # bibliothèque dist/brick.js, react et react-dom externalisés
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

## Référentiels
Chaque fichier de tranche (`AA-AA.json`) porte `version`, `dateValidation` (`null` tant que le pharmacien référent n'a pas validé) et des références de source (document + page). Un référentiel invalide bloque le démarrage et l'écran indique le fichier et le champ en erreur.

## État
Incrément 1 (socle) : structure de la brique, mount/unmount, ouverture de session et sélection de la tranche d'âge (M1), référentiel 45-50 validé par Zod (M16).
