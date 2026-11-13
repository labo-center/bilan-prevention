import { describe, expect, it } from 'vitest';
import {
  evaluerAmsler, evaluerIdeesSuicidaires, evaluerMedecinTraitant, evaluerPolymedication, evaluerReperesAlcool,
} from '../situations';
import { scoresReels } from '../../referentiels/__tests__/fixtures';

const s = scoresReels();

describe('Amsler', () => {
  it('anormal : alerte rouge, ophtalmologue en moins d’une semaine', () =>
    expect(evaluerAmsler(true, s.amsler)).toMatchObject({ niveau: 'rouge', message: expect.stringMatching(/ophtalmologue \(moins d’une semaine\)/) }));
  it.each([false, undefined])('%s : rien', (v) => expect(evaluerAmsler(v, s.amsler)).toBeNull());
});

describe('Polymédication (> 10 traitements)', () => {
  it('10 : rien', () => expect(evaluerPolymedication(10, s.polymedication)).toBeNull());
  it('11 : informer le médecin traitant', () =>
    expect(evaluerPolymedication(11, s.polymedication)).toMatchObject({ niveau: 'orange', message: expect.stringMatching(/médecin traitant/) }));
  it('non renseigné : rien', () => expect(evaluerPolymedication(undefined, s.polymedication)).toBeNull());
});

describe('Idées suicidaires (M10)', () => {
  it('case cochée : alerte rouge, 31 14, thématique bien-être mental', () =>
    expect(evaluerIdeesSuicidaires(true, s.ideesSuicidaires)).toMatchObject({
      niveau: 'rouge', message: expect.stringMatching(/31 14/), thematique: 'bien-etre-mental-social',
    }));
  it('case non cochée : rien', () => expect(evaluerIdeesSuicidaires(false, s.ideesSuicidaires)).toBeNull());
});

describe('Médecin traitant', () => {
  it('absent : signalement CPAM avec accord du patient', () =>
    expect(evaluerMedecinTraitant(false, s.medecinTraitant)).toMatchObject({ message: expect.stringMatching(/CPAM/) }));
  it.each([true, undefined])('%s : rien', (v) => expect(evaluerMedecinTraitant(v, s.medecinTraitant)).toBeNull());
});

describe('Repères alcool (Q33)', () => {
  it('aucun repère dépassé : rien', () =>
    expect(evaluerReperesAlcool({ plus2ParJour: false, plus10ParSemaine: false, moins2JoursSans: false }, s.reperesAlcool)).toBeNull());
  it.each(['plus2ParJour', 'plus10ParSemaine', 'moins2JoursSans'])('%s seul : évaluation du risque', (id) =>
    expect(evaluerReperesAlcool({ [id]: true }, s.reperesAlcool)).toMatchObject({ niveau: 'orange', reperesDepasses: [id] }));
});
