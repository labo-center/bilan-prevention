import { createContext, useContext, type ReactNode } from 'react';
import type { BrickConfig } from './config';
import type { DataClient } from './data/DataClient';

export type Theme = 'clair' | 'contraste';

/** Contexte fourni par le shell hôte (ou par le harnais de développement). */
export interface BrickContext {
  config: BrickConfig;
  data: DataClient;
  /** Aucune IA en v1. */
  ai: null;
  /** Utilisateur connecté au shell, sans usage en v1 (pas d'authentification). */
  user: { nom: string } | null;
  theme: Theme;
}

const Ctx = createContext<BrickContext | null>(null);

export function BrickProvider({ value, children }: { value: BrickContext; children: ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useBrick(): BrickContext {
  const v = useContext(Ctx);
  if (!v) throw new Error('useBrick doit être utilisé sous <BrickProvider>');
  return v;
}
