import { useId } from 'react';
import type { EvaluationSession } from '../logic/evaluation';
import type { EntreeFiche } from '../logic/preremplissage';
import type { Session } from '../logic/session';
import type { Champ, Question } from '../referentiels/schemaSaisie';
import type { ReferentielTranche } from '../referentiels/schemas';
import { ChampNombre } from './ChampNombre';
import type { PropsEtape } from './Parcours';
import { AVerifier, Declare } from './Resultat';
import styles from './Parcours.module.css';

const arrondi = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));
const dateFr = (iso: string) => iso.split('-').reverse().join('/');

/** Texte des champs calculés (session et résultats de tests). */
export function texteCalcule(lien: Extract<Champ, { type: 'calcule' }>['lien'], session: Session, ev: EvaluationSession, tranche: ReferentielTranche): string {
  const score = (r: { complet: boolean } & ({ score: number; interpretation: { message: string } } | object)) =>
    'score' in r ? `Score ${r.score} : ${r.interpretation.message}` : 'Non réalisé';
  switch (lien) {
    case 'session.dateRdv':
      return dateFr(session.ouverture.dateRdv);
    case 'session.age':
      return `${session.ouverture.age} ans`;
    case 'session.genre':
      return tranche.ouvertureSession.genres.find((g) => g.id === session.ouverture.genre)?.libelle ?? '';
    case 'tests.pa':
      return ev.pa.complet
        ? `${arrondi(ev.pa.retenue.systolique)}/${arrondi(ev.pa.retenue.diastolique)} mmHg (moyenne, bras ${ev.pa.retenue.bras})`
        : 'Non mesurée';
    case 'tests.had':
      return ev.had.every((d) => !d.complet)
        ? 'Non réalisé'
        : ev.had.map((d) => (d.complet ? `${d.dimension} = ${d.score} (${d.interpretation.message})` : `${d.dimension} incomplet`)).join(' ; ');
    case 'tests.face':
      return score(ev.face);
    case 'tests.fagerstrom':
      return score(ev.fagerstrom);
    case 'tests.cast':
      return score(ev.cast);
  }
}

/** Fiche d'aide au repérage (M3) : pré-remplie depuis l'autoquestionnaire, chaque cellule reste modifiable. */
export function FicheReperage({ session, tranche, dispatch, evaluation }: PropsEtape) {
  const questions = new Map<string, Question>(tranche.autoquestionnaire.sections.flatMap((s) => s.questions.map((q) => [q.id, q] as const)));

  const rappel = (c: Champ) => {
    const morceaux = (c.reponsesAssociees ?? []).flatMap((qid) => {
      const r = session.autoquestionnaire.reponses[qid];
      if (r === undefined) return [];
      const q = questions.get(qid);
      const libelles = [r].flat().map((v) => (q && 'options' in q ? q.options.find((o) => o.id === v)?.libelle ?? String(v) : String(v)));
      return [`${qid} : ${libelles.join(', ')}`];
    });
    return morceaux.length > 0 ? <p className={styles.rappel}>Autoquestionnaire - {morceaux.join(' ; ')}</p> : null;
  };

  return (
    <div>
      <h2 className={styles.titreEtape}>Fiche d’aide au repérage des risques</h2>
      <p className={styles.aide}>
        Les éléments marqués <Declare /> viennent de l’autoquestionnaire. Toute modification devient une saisie du professionnel.
      </p>
      {tranche.ficheReperage.sections.map((s) => (
        <section key={s.id} className={styles.section} aria-labelledby={`fiche-${s.id}`}>
          <h3 id={`fiche-${s.id}`} className={styles.titreSection}>{s.titre}</h3>
          <div className={styles.grilleChamps}>
            {s.champs.map((c) => (
              <div key={c.id} className={styles.champFiche} data-champ={c.id}>
                {c.type === 'calcule' ? (
                  <p className={styles.calcule}>
                    <span className={styles.libelleCalcule}>{c.libelle} :</span> {texteCalcule(c.lien, session, evaluation, tranche)}
                  </p>
                ) : (
                  <SaisieChamp champ={c} entree={session.fiche[c.id]} modifier={(m) => dispatch({ type: 'champ', champ: c.id, ...m })} />
                )}
                {rappel(c)}
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Marques({ entree }: { entree: EntreeFiche | undefined }) {
  if (entree?.origine !== 'declare_patient') return null;
  return (
    <>
      <Declare />
      {entree.aVerifier && <AVerifier />}
    </>
  );
}

function SaisieChamp({
  champ: c,
  entree,
  modifier,
}: {
  champ: Exclude<Champ, { type: 'calcule' }>;
  entree: EntreeFiche | undefined;
  modifier: (m: { valeur?: boolean | string | number; precision?: string }) => void;
}) {
  const id = useId();
  const v = entree?.valeur;
  const precision = c.precision && (
    <input
      aria-label={`${c.libelle} - ${c.precision}`}
      placeholder={c.precision}
      className={styles.precision}
      defaultValue={entree?.precision ?? ''}
      onChange={(e) => modifier({ precision: e.target.value })}
    />
  );

  switch (c.type) {
    case 'case':
      return (
        <>
          <label className={styles.option}>
            <input type="checkbox" checked={v === true} onChange={(e) => modifier({ valeur: e.target.checked })} />
            {c.libelle}
            <Marques entree={entree} />
          </label>
          {v === true && precision}
        </>
      );
    case 'ouiNon':
    case 'choix': {
      const options = c.type === 'ouiNon' ? [{ id: 'oui', libelle: 'Oui' }, { id: 'non', libelle: 'Non' }] : c.options;
      return (
        <fieldset className={styles.groupeFiche}>
          <legend>
            {c.libelle} <Marques entree={entree} />
          </legend>
          {c.aide && <p className={styles.aide}>{c.aide}</p>}
          <div className={styles.optionsLigne}>
            {options.map((o) => (
              <label key={o.id} className={styles.option}>
                <input type="radio" name={id} checked={v === o.id} onChange={() => modifier({ valeur: o.id })} />
                {o.libelle}
              </label>
            ))}
          </div>
          {(c.type === 'choix' ? v !== undefined : v === 'oui') && precision}
        </fieldset>
      );
    }
    case 'nombre':
      return (
        <>
          <ChampNombre libelle={c.libelle} valeur={typeof v === 'number' ? v : undefined} unite={c.unite} min={c.min} max={c.max} pas={c.pas} onChange={(n) => modifier({ valeur: n })} />
          <Marques entree={entree} />
          {c.aide && <p className={styles.aide}>{c.aide}</p>}
        </>
      );
    case 'texte':
      return (
        <div className={styles.champTexte}>
          <label htmlFor={id}>
            {c.libelle} <Marques entree={entree} />
          </label>
          {c.multiligne ? (
            <textarea id={id} className={styles.zoneTexte} defaultValue={typeof v === 'string' ? v : ''} onChange={(e) => modifier({ valeur: e.target.value })} />
          ) : (
            <input id={id} defaultValue={typeof v === 'string' ? v : ''} onChange={(e) => modifier({ valeur: e.target.value })} />
          )}
        </div>
      );
  }
}
