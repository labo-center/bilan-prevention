import { useMemo, useState } from 'react';
import { evaluerSession } from '../logic/evaluation';
import type { Action, Session } from '../logic/session';
import type { ReferentielOrientation } from '../referentiels/schemaOrientation';
import type { ReferentielScores } from '../referentiels/schemaScores';
import type { ReferentielTranche } from '../referentiels/schemas';
import { Autoquestionnaire } from './Autoquestionnaire';
import { FicheReperage } from './FicheReperage';
import { Cloture } from './Cloture';
import { DecisionPartagee } from './DecisionPartagee';
import { Minuteur } from './Minuteur';
import { PanneauFiche } from './PanneauFiche';
import { PlanPersonnalise } from './PlanPersonnalise';
import { TestsCliniques } from './TestsCliniques';
import styles from './Parcours.module.css';

const ETAPES = [
  { id: 'autoquestionnaire', libelle: 'Autoquestionnaire' },
  { id: 'fiche', libelle: 'Fiche de repérage' },
  { id: 'tests', libelle: 'Tests cliniques' },
  { id: 'decision', libelle: 'Décision partagée' },
  { id: 'ppp', libelle: 'Plan personnalisé' },
  { id: 'cloture', libelle: 'Clôture et export' },
] as const;
type Etape = (typeof ETAPES)[number]['id'];

export interface PropsEtape {
  session: Session;
  tranche: ReferentielTranche;
  scores: ReferentielScores;
  orientation: ReferentielOrientation;
  dispatch: (a: Action) => void;
  evaluation: ReturnType<typeof evaluerSession>;
  /** Ouvre la fiche thématique dans le panneau latéral (S5). */
  ouvrirFiche: (thematique: string) => void;
}

export function Parcours({
  session,
  tranche,
  scores,
  orientation,
  dispatch,
  onCloturer,
}: Omit<PropsEtape, 'evaluation' | 'ouvrirFiche'> & { onCloturer: () => void }) {
  const [etape, setEtape] = useState<Etape>('autoquestionnaire');
  const [fiche, setFiche] = useState<string | null>(null);
  const evaluation = useMemo(() => evaluerSession(session, tranche, scores), [session, tranche, scores]);
  const genre = tranche.ouvertureSession.genres.find((g) => g.id === session.ouverture.genre)?.libelle ?? session.ouverture.genre;
  const bloque = evaluation.alertesBloquantes.length > 0;
  const props: PropsEtape = { session, tranche, scores, orientation, dispatch, evaluation, ouvrirFiche: setFiche };

  const allerA = (e: Etape) => {
    setEtape(e);
    window.scrollTo?.({ top: 0 });
  };
  const indexEtape = ETAPES.findIndex((e) => e.id === etape);
  const suivante = ETAPES[indexEtape + 1];
  // Une alerte bloquante non acquittée interdit la décision partagée et le PPP (M5).
  const accessible = (e: Etape) => !((e === 'decision' || e === 'ppp' || e === 'cloture') && bloque);

  return (
    <div className={styles.parcours}>
      <section className={styles.bandeauSession} aria-labelledby="mbp-session-titre">
        <h2 id="mbp-session-titre" className={styles.titreSession}>Bilan Prévention {tranche.tranche.libelle}</h2>
        <dl className={styles.resume}>
          <dt>Âge au rendez-vous</dt>
          <dd>{session.ouverture.age} ans</dd>
          <dt>Genre</dt>
          <dd>{genre}</dd>
          <dt>Référentiel</dt>
          <dd data-testid="version-referentiel">
            {tranche.tranche.id} v{tranche.version}
            {tranche.dateValidation ? ` - validé le ${tranche.dateValidation}` : <span className={styles.badgeAVerifier}>non validé par le pharmacien référent</span>}
          </dd>
        </dl>
        <Minuteur debut={session.debut} reperesMinutes={scores.dureeEntretien.reperesMinutes} />
        <button type="button" className={styles.boutonSecondaire} onClick={onCloturer}>Clôturer la session</button>
      </section>

      {evaluation.ideesSuicidaires && (
        <div role="alert" className={styles.bandeauRouge} data-testid="bandeau-3114">
          <strong>Idées suicidaires repérées</strong>
          <p>{evaluation.ideesSuicidaires.message}</p>
        </div>
      )}
      {evaluation.alertesBloquantes.map((a) => (
        <div key={a.id} role="alert" className={styles.bandeauRouge} data-testid={`alerte-bloquante-${a.id}`}>
          <strong>Alerte à acquitter</strong>
          <p>{a.message}</p>
          <button type="button" className={styles.boutonAlerte} onClick={() => dispatch({ type: 'acquitter', alerte: a.id })}>
            Acquitter l’alerte
          </button>
        </div>
      ))}

      <nav aria-label="Étapes du bilan">
        <ol className={styles.etapes}>
          {ETAPES.map((e, i) => (
            <li key={e.id}>
              <button
                type="button"
                className={styles.etape}
                aria-current={etape === e.id ? 'step' : undefined}
                disabled={!accessible(e.id)}
                onClick={() => allerA(e.id)}
              >
                {i + 1}. {e.libelle}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className={styles.contenuEtape}>
        {etape === 'autoquestionnaire' && <Autoquestionnaire {...props} />}
        {etape === 'fiche' && <FicheReperage {...props} />}
        {etape === 'tests' && <TestsCliniques {...props} />}
        {etape === 'decision' && <DecisionPartagee {...props} />}
        {etape === 'ppp' && <PlanPersonnalise {...props} />}
        {etape === 'cloture' && <Cloture {...props} onCloturer={onCloturer} />}
      </div>

      {fiche && <PanneauFiche thematique={fiche} scores={scores} onFermer={() => setFiche(null)} />}

      {suivante && (
        <div className={styles.piedEtape}>
          {!accessible(suivante.id) && <p className={styles.incomplet}>Acquitter l’alerte rouge pour continuer.</p>}
          <button type="button" className={styles.boutonPrincipal} disabled={!accessible(suivante.id)} onClick={() => allerA(suivante.id)}>
            Étape suivante : {suivante.libelle}
          </button>
        </div>
      )}
    </div>
  );
}
