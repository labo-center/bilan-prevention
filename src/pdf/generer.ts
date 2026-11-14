import type { ModeleDocument } from '../logic/document';

export interface Polices {
  normale: string;
  grasse: string;
}

/**
 * Génère le PDF dans le navigateur (aucune donnée envoyée). @react-pdf est chargé à la demande
 * pour ne pas alourdir le démarrage de la brique.
 */
export async function genererPdf(modele: ModeleDocument, polices: Polices): Promise<Blob> {
  const [{ Font, pdf }, { DocumentBilan }, { createElement }] = await Promise.all([
    import('@react-pdf/renderer'),
    import('./DocumentBilan'),
    import('react'),
  ]);
  enregistrerPolices(Font, polices);
  return pdf(createElement(DocumentBilan, { modele }) as Parameters<typeof pdf>[0]).toBlob();
}

let policesEnregistrees = false;
/** Liberation Sans (SIL OFL) : couvre « ≥ », « ’ » et « Œ », absents des polices PDF standard. */
export function enregistrerPolices(Font: typeof import('@react-pdf/renderer').Font, polices: Polices): void {
  if (policesEnregistrees) return;
  Font.register({ family: 'MBP', fonts: [{ src: polices.normale }, { src: polices.grasse, fontWeight: 'bold' }] });
  // Pas de césure automatique : les numéros de téléphone et adresses restent entiers.
  Font.registerHyphenationCallback((mot) => [mot]);
  policesEnregistrees = true;
}
