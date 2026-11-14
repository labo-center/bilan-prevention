import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist', 'dist-app', 'coverage', 'node_modules', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // PRD §7.3 : aucun log, pour ne jamais exposer de donnée de session.
      'no-console': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
    },
  },
  {
    // Scripts d'outillage exécutés par Node (hors brique, aucune donnée patient).
    files: ['scripts/**/*.mjs'],
    languageOptions: { globals: globals.node },
  },
  {
    // Données de santé : aucune persistance navigateur (CLAUDE.md, PRD §7.3). Les tests peuvent lire le stockage pour le vérifier.
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/__tests__/**'],
    rules: {
      'no-restricted-globals': ['error', 'localStorage', 'sessionStorage', 'indexedDB', 'caches'],
      'no-restricted-properties': [
        'error',
        { object: 'document', property: 'cookie', message: 'Aucun cookie : données de santé non persistées.' },
        { object: 'window', property: 'localStorage' },
        { object: 'window', property: 'sessionStorage' },
        { object: 'window', property: 'indexedDB' },
        { object: 'navigator', property: 'sendBeacon', message: 'Aucun envoi réseau de données de session.' },
      ],
    },
  },
  {
    // logic/ : fonctions pures, testables sans navigateur (PRD annexe D).
    files: ['src/logic/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': ['error', { patterns: ['react', 'react-dom', 'react-dom/*', '../ui/*', '../data/*'] }],
      'no-restricted-globals': ['error', 'window', 'document', 'localStorage', 'sessionStorage', 'fetch'],
    },
  },
);
