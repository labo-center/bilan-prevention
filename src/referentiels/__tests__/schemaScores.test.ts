import { describe, expect, it } from 'vitest';
import { chargerReferentiels } from '../loader';
import { lireReferentielsReels, lireScores } from './fixtures';

type Json = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Charge les référentiels réels avec un scores.json modifié et retourne les champs en erreur. */
function champsEnErreur(modifier: (s: Json) => void): string[] {
  const s = lireScores() as Json;
  modifier(s);
  const r = chargerReferentiels({ ...lireReferentielsReels(), 'referentiels/scores.json': JSON.stringify(s) });
  return r.ok ? [] : r.erreurs.map((e) => `${e.fichier}:${e.champ}`);
}

describe('Validation de scores.json (M16)', () => {
  it('le fichier réel est valide', () => expect(champsEnErreur(() => {})).toEqual([]));

  it('grille non croissante : refus', () =>
    expect(champsEnErreur((s) => { s.cast.seuils[2].max = 1; })).toContain('referentiels/scores.json:cast.seuils[2].max'));

  it('grille ne couvrant pas le score maximal : refus', () =>
    expect(champsEnErreur((s) => { s.cast.seuils[3].max = 5; })).toContain('referentiels/scores.json:cast.seuils[3].max'));

  it('FACE : grille femmes incohérente avec le score maximal : refus', () =>
    expect(champsEnErreur((s) => { s.face.seuilsParGenre.F[2].max = 19; })).toContain('referentiels/scores.json:face.seuilsParGenre.F[2].max'));

  it('HAD : grille ne couvrant pas 21 : refus', () =>
    expect(champsEnErreur((s) => { s.had.seuils[2].max = 20; })).toContain('referentiels/scores.json:had.seuils[2].max'));

  it('HAD : item rattaché à une dimension inconnue : refus', () =>
    expect(champsEnErreur((s) => { s.had.items[0].dimension = 'X'; })).toContain('referentiels/scores.json:had.items[0].dimension'));

  it('borne null ailleurs qu’en dernier seuil : refus', () =>
    expect(champsEnErreur((s) => { s.imc.seuils[0].max = null; })).toContain('referentiels/scores.json:imc.seuils[0].max'));

  it('PA : seuils non classés du plus sévère au moins sévère : refus', () =>
    expect(champsEnErreur((s) => { s.pressionArterielle.seuils.reverse(); })).toContain('referentiels/scores.json:pressionArterielle.seuils'));

  it('niveau inconnu : refus', () =>
    expect(champsEnErreur((s) => { s.amsler.siAnormal.niveau = 'violet'; })).toContain('referentiels/scores.json:amsler.siAnormal.niveau'));

  it('dépistage avec ageMin > ageMax : refus', () =>
    expect(champsEnErreur((s) => { s.depistages.organises[0].ageMin = 80; })).toContain('referentiels/scores.json:depistages.organises[0].ageMax'));

  it('référence vers une source non déclarée : refus', () =>
    expect(champsEnErreur((s) => { s.cast.source.ref = 'inconnue'; })).toContain('referentiels/scores.json:cast.source.ref'));

  it('règle inconnue à la racine (seuil inventé) : refus', () =>
    expect(champsEnErreur((s) => { s.phq4 = { seuils: [] }; }).length).toBeGreaterThan(0));

  it('valeur de points négative : refus', () =>
    expect(champsEnErreur((s) => { s.face.items[0].options[0].points = -1; })).toContain('referentiels/scores.json:face.items[0].options[0].points'));
});
