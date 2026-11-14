import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import './styles/tokens.css';
import { configParDefaut } from './config';
import { BrickProvider, type BrickContext } from './context';
import { creerDataClient } from './data/factory';
import { chargerReferentiels, lireFichiersEmbarques } from './referentiels/loader';
import { App } from './ui/App';

export { manifest } from './manifest';

/** Contexte partiel accepté au montage : les champs absents prennent leur valeur par défaut. */
export type BrickContextInput = Partial<BrickContext>;

let racine: Root | null = null;
let conteneurMonte: HTMLElement | null = null;
let contexteMonte: BrickContext | null = null;

export function mount(container: HTMLElement, ctx: BrickContextInput = {}): void {
  if (racine) unmount();

  const config = { ...configParDefaut, ...ctx.config };
  const contexte: BrickContext = {
    config,
    data: ctx.data ?? creerDataClient(config),
    ai: null,
    user: ctx.user ?? null,
    theme: ctx.theme ?? 'clair',
  };

  // Validation Zod des référentiels avant tout rendu : en cas d'erreur, App affiche
  // l'écran bloquant (fichier + champ) et aucune session ne peut être ouverte (M16).
  const chargement = chargerReferentiels(lireFichiersEmbarques());

  container.setAttribute('data-mbp-racine', '');
  container.setAttribute('data-theme', contexte.theme);

  racine = createRoot(container);
  racine.render(
    <StrictMode>
      <BrickProvider value={contexte}>
        <App chargement={chargement} />
      </BrickProvider>
    </StrictMode>,
  );
  conteneurMonte = container;
  contexteMonte = contexte;
}

export function unmount(): void {
  racine?.unmount();
  contexteMonte?.data.purger();
  conteneurMonte?.removeAttribute('data-mbp-racine');
  conteneurMonte?.removeAttribute('data-theme');
  racine = null;
  conteneurMonte = null;
  contexteMonte = null;
}
