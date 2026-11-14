import { construireDocument } from '../document';
import { evaluerSession } from '../evaluation';
import { creerSession, reduireSession, type Action, type Session } from '../session';
import { orientationReelle, scoresReels, tranche4550Reelle } from '../../referentiels/__tests__/fixtures';

const tranche = tranche4550Reelle();
const scores = scoresReels();
const orientation = orientationReelle();

/** Session 45-50 type, complète, pour les tests du document et du PDF. */
export function sessionComplete(...extra: Action[]): Session {
  const actions: Action[] = [
    { type: 'champ', champ: 'nom-prenom', valeur: 'DUPONT Marie' },
    { type: 'repondre', question: 'Q4', valeur: 'oui' },
    { type: 'repondre', question: 'Q11', valeur: 1.75 },
    { type: 'repondre', question: 'Q12', valeur: 80 },
    { type: 'repondre', question: 'Q34', valeur: ['fume'] },
    { type: 'pa', lignes: [{ bras: 'gauche', systolique: 145, diastolique: 85 }, { bras: 'gauche', systolique: 145, diastolique: 85 }] },
    { type: 'priorite', thematique: 'addictions', choisie: true, max: 2 },
    { type: 'modalitesSuivi', texte: 'Point dans 1 mois' },
    ...extra,
  ];
  return actions.reduce(
    (s, a) => reduireSession(s, a, tranche.mapping.regles),
    creerSession({ dateRdv: '2026-11-13', dateNaissance: '1978-03-02', genre: 'F', age: 48, trancheId: '45-50' }),
  );
}
export const modele = (s: Session) => construireDocument(s, evaluerSession(s, tranche, scores), tranche, scores, orientation, '2026-11-14');

