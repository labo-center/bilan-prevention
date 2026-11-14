import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { Font, renderToBuffer } from '@react-pdf/renderer';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { createElement } from 'react';
import { DocumentBilan } from '../DocumentBilan';
import { enregistrerPolices } from '../generer';
import { modele, sessionComplete } from '../../logic/__tests__/fixturesSession';
import type { ModeleDocument } from '../../logic/document';

const polices = { normale: resolve(import.meta.dirname, '../polices/LiberationSans-Regular.ttf'), grasse: resolve(import.meta.dirname, '../polices/LiberationSans-Bold.ttf') };

/** Rend le PDF comme dans le navigateur, puis en extrait le texte page par page. */
async function texteDuPdf(m: ModeleDocument): Promise<{ pages: string[]; octets: Uint8Array }> {
  enregistrerPolices(Font, polices);
  const tampon = await renderToBuffer(createElement(DocumentBilan, { modele: m }) as Parameters<typeof renderToBuffer>[0]);
  const octets = new Uint8Array(tampon);
  const doc = await getDocument({ data: octets.slice(), useSystemFonts: false, verbosity: 0 }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const contenu = await (await doc.getPage(i)).getTextContent();
    pages.push(contenu.items.map((it) => ('str' in it ? it.str : '')).join(' ').replace(/\s+/g, ' '));
  }
  return { pages, octets };
}

describe('Export PDF (M14)', () => {
  it('1 PDF en 2 sections A4 : fiche puis PPP, version du référentiel en pied de page', async () => {
    const m = modele(sessionComplete());
    const { pages, octets } = await texteDuPdf(m);
    expect(new TextDecoder().decode(octets.slice(0, 5))).toBe('%PDF-');
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('Fiche d’aide au repérage des risques entre 45 et 50 ans');
    expect(pages[0]).toContain('DUPONT Marie');
    expect(pages[1]).toContain('Plan Personnalisé de Prévention');
    expect(pages[1]).toContain('Tabac Info Service (3989)');
    expect(pages[0]).toContain('Fiche de repérage - Référentiel MBP 45-50 v');
    expect(pages[1]).toContain('Plan Personnalisé de Prévention - Référentiel MBP 45-50 v');
    expect(pages[0]).toContain('1,75 m');
    expect(pages[0]).not.toContain('INCOMPLET');
  }, 30000);

  it('PPP de 2 lignes (priorité + ajout d’office) : tient toujours en 2 pages', async () => {
    const { pages } = await texteDuPdf(modele(sessionComplete({ type: 'repondre', question: 'Q44', valeur: ['idees'] })));
    expect(pages).toHaveLength(2);
    expect(pages[1]).toContain('31 14');
    expect(pages[1]).toContain('Je m’oppose');
  }, 30000);

  it('caractères du livret rendus fidèlement (≥, apostrophe typographique)', async () => {
    const { pages } = await texteDuPdf(modele(sessionComplete()));
    expect(pages[0]).toContain('Si PA ≥ 140/90 mmHg');
    expect(pages[1]).toContain('Associations d’entraide');
  }, 30000);

  it('opposition cochée : mention sur le PPP', async () => {
    const { pages } = await texteDuPdf(modele(sessionComplete({ type: 'opposition', oppose: true })));
    expect(pages[1]).toContain('Le patient s’oppose à la transmission au médecin traitant.');
    expect(pages[1]).toContain('[X] Je m’oppose à ce que ce document soit communiqué à mon médecin traitant.');
  }, 30000);

  it('calcul obligatoire manquant : mention INCOMPLET', async () => {
    const m = modele(sessionComplete({ type: 'pa', lignes: [] }));
    const { pages } = await texteDuPdf(m);
    expect(pages[0]).toContain('INCOMPLET - calcul obligatoire manquant : Mesure de la pression artérielle');
    expect(pages[1]).toContain('INCOMPLET');
  }, 30000);
});
