import { ChampNombre } from './ChampNombre';
import type { PropsEtape } from './Parcours';
import type { Question } from '../referentiels/schemaSaisie';
import { basculerOption } from '../logic/session';
import styles from './Parcours.module.css';

/** Autoquestionnaire patient (M2) : libellés du PDF officiel, aucune question obligatoire, gros caractères. */
export function Autoquestionnaire({ session, tranche, dispatch }: PropsEtape) {
  const aq = tranche.autoquestionnaire;
  const { reponses, precisions } = session.autoquestionnaire;
  const visible = (q: Question) =>
    !q.afficherSi ||
    [reponses[q.afficherSi.question]].flat().some((r) => typeof r === 'string' && q.afficherSi!.valeurs.includes(r));

  return (
    <div className={styles.patient}>
      <h2 className={styles.titreEtape}>Autoquestionnaire</h2>
      <p className={styles.introduction}>{aq.introduction}</p>
      {aq.sections.map((s) => (
        <section key={s.id} className={styles.section} aria-labelledby={`aq-${s.id}`}>
          <h3 id={`aq-${s.id}`} className={styles.titreSection}>{s.titre}</h3>
          {s.questions.filter(visible).map((q) => (
            <QuestionAQ
              key={q.id}
              q={q}
              reponse={reponses[q.id]}
              precisions={precisions}
              repondre={(valeur) => dispatch({ type: 'repondre', question: q.id, valeur })}
              preciser={(cle, texte) => dispatch({ type: 'preciser', cle, texte })}
            />
          ))}
        </section>
      ))}
      <p className={styles.introduction}>Merci. Vous pouvez rendre la tablette au professionnel de santé.</p>
    </div>
  );
}

function QuestionAQ({
  q,
  reponse,
  precisions,
  repondre,
  preciser,
}: {
  q: Question;
  reponse: string | string[] | number | undefined;
  precisions: Readonly<Record<string, string>>;
  repondre: (v: string | string[] | number | undefined) => void;
  preciser: (cle: string, texte: string) => void;
}) {
  // Numérotation du PDF : « Q46bis » s'affiche « Q46 bis ».
  const titre = `${q.id.replace(/bis$/, ' bis')} - ${q.libelle}`;

  if (q.type === 'nombre') {
    return (
      <div className={styles.question}>
        <ChampNombre grand libelle={titre} valeur={typeof reponse === 'number' ? reponse : undefined} unite={q.unite} min={q.min} max={q.max} pas={q.pas} onChange={repondre} />
      </div>
    );
  }
  if (q.type === 'texte') {
    return (
      <div className={styles.question}>
        <label className={styles.legende} htmlFor={`aq-${q.id}`}>{titre}</label>
        <textarea id={`aq-${q.id}`} className={styles.zoneTexte} defaultValue={typeof reponse === 'string' ? reponse : ''} onChange={(e) => repondre(e.target.value)} />
      </div>
    );
  }

  const multiple = q.type === 'multiple';
  const coches: string[] = Array.isArray(reponse) ? reponse : typeof reponse === 'string' ? [reponse] : [];
  const exclusives = q.options.filter((o) => o.exclusive).map((o) => o.id);

  return (
    <fieldset className={styles.question}>
      <legend className={styles.legende}>{titre}</legend>
      {q.aide && <p className={styles.aide}>{q.aide}</p>}
      <div className={styles.options}>
        {q.options.map((o) => {
          const coche = coches.includes(o.id);
          return (
            <div key={o.id}>
              <label className={styles.option}>
                <input
                  type={multiple ? 'checkbox' : 'radio'}
                  name={`aq-${q.id}`}
                  checked={coche}
                  onChange={(e) => repondre(multiple ? basculerOption(coches, o.id, e.target.checked, exclusives) : o.id)}
                />
                {o.libelle}
              </label>
              {o.precision && coche && (
                <input
                  aria-label={`Précisez : ${o.libelle}`}
                  className={styles.precision}
                  defaultValue={precisions[`${q.id}.${o.id}`] ?? ''}
                  onChange={(e) => preciser(`${q.id}.${o.id}`, e.target.value)}
                />
              )}
            </div>
          );
        })}
      </div>
      {!multiple && coches.length > 0 && (
        <button type="button" className={styles.boutonLien} onClick={() => repondre(undefined)}>
          Effacer ma réponse
        </button>
      )}
    </fieldset>
  );
}
