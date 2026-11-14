// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { BrickProvider, type BrickContext } from '../../context';
import { configParDefaut } from '../../config';
import { creerMemoryClient } from '../../data/memoryClient';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels } from '../../referentiels/__tests__/fixtures';
import { mount, unmount } from '../../brick';

let ctx: BrickContext;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-13T09:00:00'));
  ctx = { config: configParDefaut, data: creerMemoryClient(), ai: null, user: null, theme: 'clair' };
  render(
    <BrickProvider value={ctx}>
      <App chargement={chargerReferentiels(lireReferentielsReels())} />
    </BrickProvider>,
  );
  fireEvent.change(screen.getByLabelText('Date du rendez-vous'), { target: { value: '2026-11-13' } });
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1978-03-02' } });
  fireEvent.click(screen.getByLabelText('Femme'));
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const etape = (nom: RegExp) =>
  fireEvent.click(within(screen.getByRole('navigation', { name: 'Étapes du bilan' })).getByRole('button', { name: nom }));
const avancer = (minutes: number) => act(() => vi.advanceTimersByTime(minutes * 60_000));

/** Saisit un nom dans la fiche : sert de témoin pour vérifier la purge. */
function saisirNom() {
  etape(/Fiche de repérage/);
  fireEvent.change(screen.getByLabelText('Nom et prénom'), { target: { value: 'DUPONT Marie' } });
  expect(document.body.innerHTML).toContain('DUPONT Marie');
}

function verifierPurge() {
  expect(screen.getByRole('button', { name: 'Ouvrir la session' })).toBeTruthy();
  expect(document.body.innerHTML).not.toContain('DUPONT');
  expect(ctx.data.taille()).toBe(0);
  expect(localStorage.length).toBe(0);
  expect(sessionStorage.length).toBe(0);
  expect(document.cookie).toBe('');
}

describe('Purge de session (M15)', () => {
  it('clôture : plus aucune donnée patient en mémoire, à l’écran ni dans le stockage', () => {
    saisirNom();
    fireEvent.click(screen.getAllByRole('button', { name: 'Clôturer la session' })[0]!);
    verifierPurge();
    expect(screen.getByRole('status').textContent).toMatch(/données saisies ont été effacées/);
  });

  it('30 min d’inactivité : purge automatique et message', () => {
    saisirNom();
    avancer(29);
    expect(document.body.innerHTML).toContain('DUPONT Marie');
    avancer(1);
    verifierPurge();
    expect(screen.getByRole('status').textContent).toMatch(/30 minutes d’inactivité/);
  });

  it('une interaction relance le délai d’inactivité', () => {
    saisirNom();
    avancer(25);
    fireEvent.keyDown(screen.getByLabelText('Nom et prénom'), { key: 'a' });
    avancer(25);
    expect(document.body.innerHTML).toContain('DUPONT Marie');
    avancer(5);
    verifierPurge();
  });
});

describe('Minuteur d’entretien (S3)', () => {
  it('passe en orange à 45 min sans interrompre la saisie', () => {
    const minuteur = () => screen.getByTestId('minuteur');
    expect(minuteur().textContent).toMatch(/00:00/);
    // Activité régulière pour ne pas déclencher la purge d'inactivité.
    for (let i = 0; i < 9; i++) {
      avancer(5);
      fireEvent.pointerDown(minuteur());
    }
    expect(minuteur().textContent).toMatch(/45:00 - 45 min dépassées/);
    expect(minuteur().getAttribute('data-depasse')).toBe('true');
    saisirNom();
  });
});

describe('Clôture et export', () => {
  it('RVA et kit DOCCR cochés ensemble : message bloquant, export impossible (S2)', () => {
    etape(/Clôture et export/);
    const exporter = screen.getByRole('button', { name: 'Exporter le PDF' }) as HTMLButtonElement;
    expect(exporter.disabled).toBe(false);
    fireEvent.click(screen.getByLabelText('RVA - Acte de vaccination'));
    fireEvent.click(screen.getByLabelText('DOCCR - Remise du kit DOCCR'));
    expect(screen.getByTestId('facturation-bloquante').textContent).toBe('1 seul acte complémentaire facturable par Bilan Prévention');
    expect(exporter.disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('RVA - Acte de vaccination'));
    expect(exporter.disabled).toBe(false);
  });

  it('récapitulatif : RDP 30 €', () => {
    etape(/Clôture et export/);
    expect(screen.getByText(/Bilan Prévention \(pharmacien\) : 30 €/)).toBeTruthy();
  });

  it('PA et IMC non renseignés : le PDF portera la mention INCOMPLET', () => {
    etape(/Clôture et export/);
    expect(screen.getByTestId('avertissement-incomplet').textContent).toMatch(/INCOMPLET/);
  });

  it('opposition cochée dans le PPP : rappelée avant l’export', () => {
    etape(/Plan personnalisé/);
    fireEvent.click(screen.getByLabelText('Je m’oppose à ce que ce document soit communiqué à mon médecin traitant.'));
    etape(/Clôture et export/);
    expect(screen.getByText(/le patient s’y oppose/)).toBeTruthy();
  });
});

describe('Contrat de brique : aucune fuite après unmount', () => {
  it('minuterie d’inactivité et minuteur arrêtés au démontage', () => {
    cleanup();
    vi.clearAllTimers();
    const conteneur = document.createElement('div');
    document.body.appendChild(conteneur);
    act(() => mount(conteneur));
    fireEvent.change(within(conteneur).getByLabelText('Date de naissance'), { target: { value: '1978-03-02' } });
    fireEvent.click(within(conteneur).getByLabelText('Femme'));
    fireEvent.click(within(conteneur).getByRole('button', { name: 'Ouvrir la session' }));
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    act(() => unmount());
    expect(vi.getTimerCount()).toBe(0);
    conteneur.remove();
  });
});
