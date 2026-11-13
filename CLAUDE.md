# CLAUDE.md - Copilote Mon Bilan Prévention

## Sources de vérité
- Spécification : `docs/PRD_copilote_bilan_prevention.md` (lire en entier avant toute tâche, annexe D = contraintes non négociables).
- Contenu métier : uniquement les PDF officiels de `docs/sources/`. Aucun libellé, seuil, score ou orientation inventé.
- Un seuil absent des sources est marqué `"aVerifier": true` dans le référentiel et affiché comme tel à l'écran.

## Règles de travail
- Travailler **un incrément à la fois** (PRD §6.5). À la fin de chaque incrément : lancer les tests, montrer les résultats, puis s'arrêter et attendre la validation.
- Aucun seuil ni message métier en dur dans le code : tout vient de `referentiels/*.json`, validé par Zod au démarrage.
- `src/logic/` = fonctions pures (ni React, ni DOM), chaque règle a ses tests vitest, cas limites de seuils inclus.
- Styles uniquement via `tokens.css` + CSS Modules. Pas de Tailwind.

## Données de santé
- Aucune persistance : pas de `localStorage`, `IndexedDB`, cookie ni appel réseau contenant une donnée patient.
- Purge complète à la clôture de session ou après 30 min d'inactivité.
- Aucun `console.log` de données de session.

## Rédaction
- Ne jamais utiliser le tiret cadratin (le caractère U+2014) dans le code, les commentaires, les libellés, la documentation ou les messages de commit : utiliser un tiret simple (-) ou reformuler.
- Interface et documentation en français.
