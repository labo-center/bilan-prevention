# Checklist de sécurité et de protection des données

État à l'incrément 5. Chaque point est vérifié par un test automatisé, sauf mention contraire.

| Exigence | Mise en œuvre | Vérification |
|---|---|---|
| Aucune persistance de donnée patient (CLAUDE.md, PRD §7.3) | Session uniquement en mémoire vive (`DataClient` « memory ») | ESLint interdit `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `document.cookie` et `navigator.sendBeacon` dans `src/` ; tests UI et Playwright : stockage, cookies et IndexedDB vides |
| Purge à la clôture (M15) | `DataClient` vidé, état React remis à zéro, URL du PDF révoquées | `cloture.test.tsx` : plus aucune donnée à l'écran ni en mémoire ; Playwright hors ligne : même contrôle dans le navigateur réel |
| Purge après 30 min d'inactivité (M15) | Minuterie relancée à chaque interaction dans la brique, délai `config.inactiviteMinutes` | `cloture.test.tsx` (horloge simulée : 29 min sans purge, 30 min avec purge, relance sur interaction) |
| Aucun appel réseau contenant une donnée patient | PDF généré dans le navigateur ; aucune API distante | Playwright : aucune requête hors du poste ; session complète réseau coupé |
| Cache du service worker sans donnée patient | Pré-cache limité aux fichiers statiques du build | Playwright hors ligne : toutes les entrées du cache sont des fichiers statiques |
| Aucun log de données de session | ESLint `no-console` en erreur | Lint |
| CSP stricte (application autonome) | `default-src 'self'`, aucun script externe ni inline, `object-src 'none'`, `base-uri 'none'`, `form-action 'none'` ; `'wasm-unsafe-eval'` requis par le moteur de mise en page de @react-pdf | Playwright hors ligne sur le build de production : aucune violation de CSP |
| CSP en mode brique | Fixée par le shell hôte, qui doit au minimum autoriser `'wasm-unsafe-eval'`, `connect-src data: blob:` et `frame-src 'self'` | Documenté (README) - non testé, dépend de l'hôte |
| Aucun secret côté navigateur | Aucune clé ni jeton dans le code | Revue de code |
| Nom de fichier du PDF non identifiant | `bilan-prevention-{tranche}-{date du RDV}.pdf` | `document.test.ts` |
| Démontage sans fuite | `unmount()` retire écouteurs, minuteries et données | `cloture.test.tsx` : plus aucune minuterie après démontage |

## Points restant à traiter hors code
- AIPD et base légale du traitement (HYP7), avis du DPO sur l'hébergement statique (HYP6).
- Qualification DM (HYP8) avant toute diffusion hors usage personnel.
- Verrouillage de session du poste et de la tablette (PGSSI-S), géré par l'officine.
