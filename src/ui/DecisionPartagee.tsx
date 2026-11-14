import { thematiquesAPrioriser, thematiquesSouhaitees } from '../logic/decision';
import type { PropsEtape } from './Parcours';
import { BoutonFiche } from './PanneauFiche';
import { RisquesReperes } from './RisquesReperes';
import styles from './Parcours.module.css';

const LIBELLE_NIVEAU = { rouge: 'alerte', orange: 'à orienter', info: 'information' } as const;

/** Décision partagée : risques repérés, choix de 1 ou 2 priorités (M12), entretien motivationnel (S1). */
export function DecisionPartagee(props: PropsEtape) {
  const { session, tranche, scores, orientation, evaluation: ev, dispatch, ouvrirFiche } = props;
  const libelles = new Map(scores.thematiques.items.map((t) => [t.id, t.libelle]));
  const max = orientation.decisionPartagee.prioritesMax;
  const priorites = session.decision.priorites;
  const proposees = thematiquesAPrioriser(ev.risques, thematiquesSouhaitees(session.autoquestionnaire.reponses, tranche.souhaitsPatient));
  const autres = scores.thematiques.items.filter((t) => !proposees.some((p) => p.thematique === t.id));
  const complet = priorites.length >= max;

  const choix = (thematique: string, choisie: boolean) => dispatch({ type: 'priorite', thematique, choisie, max });

  return (
    <div>
      <h2 className={styles.titreEtape}>Décision partagée</h2>
      <section className={styles.section} aria-label="Matrice des risques">
        <RisquesReperes {...props} />
      </section>

      <section className={styles.section} aria-labelledby="mbp-priorites">
        <h3 id="mbp-priorites" className={styles.titreSection}>Priorités choisies avec le patient (1 ou {max})</h3>
        <p className={styles.aide}>{orientation.decisionPartagee.consigne}</p>
        <ul className={styles.listePriorites}>
          {proposees.map((t) => {
            const libelle = libelles.get(t.thematique) ?? t.thematique;
            const choisie = priorites.includes(t.thematique);
            return (
              <li key={t.thematique} data-thematique={t.thematique}>
                <label className={styles.option}>
                  <input type="checkbox" checked={choisie} disabled={!choisie && complet} onChange={(e) => choix(t.thematique, e.target.checked)} />
                  {libelle}
                </label>
                <span className={styles.aide}>
                  {t.nbRisques > 0 && ` ${t.nbRisques} risque${t.nbRisques > 1 ? 's' : ''} (${LIBELLE_NIVEAU[t.niveauMax!]})`}
                  {t.souhaitee && <span className={styles.badgeDeclare}>Souhaité par le patient</span>}
                </span>
                <BoutonFiche thematique={t.thematique} libelle={libelle} ouvrir={ouvrirFiche} />
              </li>
            );
          })}
        </ul>
        {!complet && autres.length > 0 && (
          <label className={styles.champTexte}>
            Autre thématique
            <select value="" onChange={(e) => e.target.value && choix(e.target.value, true)}>
              <option value="">Choisir une thématique…</option>
              {autres.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
            </select>
          </label>
        )}
        {complet && <p className={styles.incomplet} role="status">{max} priorités choisies : retirer une priorité pour en choisir une autre.</p>}
      </section>

      {priorites.map((t) => <Entretien key={t} thematique={t} libelle={libelles.get(t) ?? t} {...props} />)}
    </div>
  );
}

function Entretien({ thematique, libelle, session, orientation, dispatch }: PropsEtape & { thematique: string; libelle: string }) {
  const em = orientation.entretienMotivationnel;
  const e = session.decision.entretiens[thematique] ?? { balance: {} };
  const balanceVisible = (e.stade !== undefined && em.balance.stadesRecommandes.includes(e.stade)) || e.balanceOuverte === true;
  const questions = em.questionsParThematique.filter((q) => q.thematique === thematique);
  const nom = `stade-${thematique}`;

  return (
    <section className={styles.section} aria-label={`Entretien motivationnel : ${libelle}`} data-entretien={thematique}>
      <h3 className={styles.titreSection}>Entretien motivationnel : {libelle}</h3>
      <fieldset className={styles.groupeFiche}>
        <legend>Stade de changement</legend>
        <div className={styles.listeStades}>
          {em.stades.map((s) => (
            <label key={s.id} className={styles.stade}>
              <input type="radio" name={nom} checked={e.stade === s.id} onChange={() => dispatch({ type: 'stade', thematique, stade: s.id })} />
              <span>
                <strong>{s.libelle}</strong>
                <span className={styles.aide}> {s.description}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {balanceVisible ? (
        <div className={styles.balance} role="group" aria-label="Balance décisionnelle">
          <h4 className={styles.titreSection}>Balance décisionnelle</h4>
          <div className={styles.grilleBalance}>
            {em.balance.cases.map((c) => (
              <label key={c.id} className={styles.caseBalance}>
                {c.libelle}
                <textarea className={styles.zoneTexte} defaultValue={e.balance[c.id] ?? ''} onChange={(ev) => dispatch({ type: 'balance', thematique, case: c.id, texte: ev.target.value })} />
              </label>
            ))}
          </div>
          <ul className={styles.consignes}>{em.balance.consignes.map((c) => <li key={c}>{c}</li>)}</ul>
        </div>
      ) : (
        <button type="button" className={styles.boutonLien} onClick={() => dispatch({ type: 'ouvrirBalance', thematique })}>
          Afficher la balance décisionnelle
        </button>
      )}

      {questions.map((q) => (
        <div key={q.titre}>
          <h4 className={styles.titreSection}>{q.titre}</h4>
          <ul className={styles.consignes}>{q.questions.map((x) => <li key={x}>{x}</li>)}</ul>
          <p className={styles.aide}>Source : livret, p. {q.source.page}</p>
        </div>
      ))}
    </section>
  );
}
