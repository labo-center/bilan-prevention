// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { App } from '../App';
import { BrickProvider, type BrickContext } from '../../context';
import { configParDefaut } from '../../config';
import { creerMemoryClient } from '../../data/memoryClient';
import { chargerReferentiels } from '../../referentiels/loader';
import { lireReferentielsReels } from '../../referentiels/__tests__/fixtures';
import { mount, unmount } from '../../brick';

afterEach(cleanup);

function rendre(fichiers = lireReferentielsReels()) {
  const ctx: BrickContext = { config: configParDefaut, data: creerMemoryClient(), ai: null, user: null, theme: 'clair' };
  render(
    <BrickProvider value={ctx}>
      <App chargement={chargerReferentiels(fichiers)} />
    </BrickProvider>,
  );
  return ctx;
}

function ouvrir(dateNaissance: string, dateRdv = '2026-11-13', genre = 'Femme') {
  fireEvent.change(screen.getByLabelText('Date du rendez-vous'), { target: { value: dateRdv } });
  fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: dateNaissance } });
  fireEvent.click(screen.getByLabelText(genre));
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
}

describe('Ouverture de session (M1)', () => {
  it('47 ans : le référentiel 45-50 est chargé et la fiche ouverte', () => {
    const ctx = rendre();
    ouvrir('1979-05-10');
    expect(screen.getByRole('heading', { name: 'Bilan Prévention 45-50 ans' })).toBeTruthy();
    expect(screen.getByText('47 ans')).toBeTruthy();
    expect(screen.getByTestId('version-referentiel').textContent).toMatch(/45-50 v\d+\.\d+\.\d+/);
    expect(screen.getByText('Mesure de la pression artérielle')).toBeTruthy();
    expect(ctx.data.taille()).toBe(1);
  });

  it('51 ans : message bloquant "Hors tranche Bilan Prévention", aucune fiche ouverte', () => {
    const ctx = rendre();
    ouvrir('1975-01-01');
    const alerte = screen.getByRole('alert');
    expect(within(alerte).getByText('Hors tranche Bilan Prévention')).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /Bilan Prévention 45-50/ })).toBeNull();
    expect(ctx.data.taille()).toBe(0);
  });

  it('veille des 51 ans : encore dans la tranche (bornes incluses)', () => {
    rendre();
    ouvrir('1975-11-14');
    expect(screen.getByRole('heading', { name: 'Bilan Prévention 45-50 ans' })).toBeTruthy();
  });

  it('date de naissance manquante : message, aucune fiche', () => {
    rendre();
    ouvrir('');
    expect(screen.getByRole('alert').textContent).toMatch(/Date de naissance invalide/);
    expect(screen.queryByRole('heading', { name: /Bilan Prévention 45-50/ })).toBeNull();
  });

  it('genre non renseigné : message, aucune fiche', () => {
    rendre();
    fireEvent.change(screen.getByLabelText('Date de naissance'), { target: { value: '1979-05-10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir la session' }));
    expect(screen.getByRole('alert').textContent).toMatch(/genre/);
  });

  it('les options de genre sont celles de la fiche de repérage', () => {
    rendre();
    for (const g of ['Homme', 'Femme', 'Ne souhaite pas répondre']) expect(screen.getByLabelText(g)).toBeTruthy();
  });

  it('clôture : retour à l\'ouverture et données de session purgées', () => {
    const ctx = rendre();
    ouvrir('1979-05-10');
    fireEvent.click(screen.getByRole('button', { name: 'Clôturer la session' }));
    expect(screen.getByRole('button', { name: 'Ouvrir la session' })).toBeTruthy();
    expect(ctx.data.taille()).toBe(0);
  });
});

describe('Référentiel invalide (M16)', () => {
  it('JSON corrompu : démarrage refusé, fichier et champ affichés', () => {
    const fichiers = lireReferentielsReels();
    const ref = JSON.parse(fichiers['referentiels/45-50.json']!);
    ref.tranche.ageMin = 'quarante-cinq';
    rendre({ ...fichiers, 'referentiels/45-50.json': JSON.stringify(ref) });
    const alerte = screen.getByRole('alert');
    expect(within(alerte).getByText(/Démarrage impossible/)).toBeTruthy();
    expect(within(alerte).getByText('referentiels/45-50.json')).toBeTruthy();
    expect(within(alerte).getByText('tranche.ageMin')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ouvrir la session' })).toBeNull();
  });

  it('JSON illisible : démarrage refusé', () => {
    rendre({ 'referentiels/45-50.json': '{ cassé' });
    expect(screen.getByText(/Démarrage impossible/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Ouvrir la session' })).toBeNull();
  });
});

describe('Contrat de brique : mount / unmount', () => {
  it('monte la brique, applique le thème, puis démonte sans résidu et purge les données', () => {
    const conteneur = document.createElement('div');
    document.body.appendChild(conteneur);
    const data = creerMemoryClient();
    act(() => mount(conteneur, { data, theme: 'contraste' }));
    expect(conteneur.getAttribute('data-theme')).toBe('contraste');
    expect(within(conteneur).getByRole('button', { name: 'Ouvrir la session' })).toBeTruthy();

    data.ecrire('session', { factice: true });
    act(() => unmount());
    expect(conteneur.innerHTML).toBe('');
    expect(conteneur.hasAttribute('data-mbp-racine')).toBe(false);
    expect(data.taille()).toBe(0);
    conteneur.remove();
  });

  it('un second mount remplace proprement le premier', () => {
    const a = document.createElement('div');
    const b = document.createElement('div');
    act(() => mount(a));
    act(() => mount(b));
    expect(a.innerHTML).toBe('');
    expect(b.innerHTML).not.toBe('');
    act(() => unmount());
  });
});
