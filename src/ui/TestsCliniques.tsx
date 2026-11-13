import { useId, type ReactNode } from 'react';
import type { LignePa } from '../logic/session';
import { pointsCigarettesParJour } from '../logic/fagerstrom';
import { ChampNombre } from './ChampNombre';
import type { PropsEtape } from './Parcours';
import { AVerifier, Incomplet, Resultat } from './Resultat';
import styles from './Parcours.module.css';

const RAISONS_IMC = {
  'poids-manquant': 'IMC non calculable : poids non renseigné.',
  'taille-manquante': 'IMC non calculable : taille non renseignée.',
  'valeur-invalide': 'IMC non calculable : valeur invalide.',
} as const;

const arrondi = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

/** Tests cliniques applicables à la tranche (livret p. 11), avec scores et alertes (M4 à M11). */
export function TestsCliniques(props: PropsEtape) {
  const { tranche, scores, evaluation: ev } = props;
  return (
    <div>
      <h2 className={styles.titreEtape}>Tests cliniques</h2>
      {tranche.testsApplicables.items.map((t) => (
        <section key={t.id} className={styles.section} aria-labelledby={`test-${t.id}`}>
          <h3 id={`test-${t.id}`} className={styles.titreSection}>
            {t.libelle} {t.aVerifier && <AVerifier />}
          </h3>
          {SAISIES[t.id]?.(props) ?? <TexteLibre test={t.id} {...props} />}
        </section>
      ))}

      <section className={styles.section} aria-labelledby="test-depistages">
        <h3 id="test-depistages" className={styles.titreSection}>Dépistages organisés des cancers</h3>
        {ev.depistages.length === 0 ? (
          <p className={styles.aide}>Aucun dépistage organisé à rappeler pour cet âge et ce genre.</p>
        ) : (
          <ul className={styles.listeDepistages}>
            {ev.depistages.map((d) => (
              <li key={`${d.type}-${d.id}`} data-depistage={d.id}>
                <strong>{d.libelle}</strong> - {d.modalite}
                {d.siConcerne && <span className={styles.aide}> ({scores.depistages.genreNonRenseigne})</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function TexteLibre({ test, session, dispatch }: PropsEtape & { test: string }) {
  const id = useId();
  return (
    <div className={styles.champTexte}>
      <label htmlFor={id}>Résultat</label>
      <input id={id} defaultValue={session.tests.textes[test] ?? ''} onChange={(e) => dispatch({ type: 'texteTest', test, texte: e.target.value })} />
    </div>
  );
}

/** Groupe de boutons radio pour un item de questionnaire coté. */
function ItemCote({
  nom,
  libelle,
  options,
  valeur,
  onChange,
}: {
  nom: string;
  libelle: string;
  options: ReadonlyArray<{ libelle: string; points: number }>;
  valeur: number | undefined;
  onChange: (p: number) => void;
}) {
  return (
    <fieldset className={styles.groupeFiche}>
      <legend>{libelle}</legend>
      <div className={styles.optionsLigne}>
        {options.map((o) => (
          <label key={o.libelle} className={styles.option}>
            <input type="radio" name={nom} checked={valeur === o.points} onChange={() => onChange(o.points)} />
            {o.libelle} <span className={styles.points}>({o.points})</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const SAISIES: Record<string, (p: PropsEtape) => ReactNode> = {
  imc: ({ tranche, session, dispatch, evaluation: ev }) => {
    const champ = (id: string) => session.fiche[id]?.valeur;
    const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
    return (
      <>
        <div className={styles.optionsLigne}>
          <ChampNombre libelle="Taille" unite="m" pas={0.01} valeur={num(champ(tranche.liaisons.taille))} onChange={(v) => dispatch({ type: 'champ', champ: tranche.liaisons.taille, valeur: v })} />
          <ChampNombre libelle="Poids" unite="kg" pas={0.1} valeur={num(champ(tranche.liaisons.poids))} onChange={(v) => dispatch({ type: 'champ', champ: tranche.liaisons.poids, valeur: v })} />
        </div>
        {ev.imc.calculable ? (
          <Resultat niveau={ev.imc.interpretation.niveau} aVerifier={ev.imc.interpretation.aVerifier}>
            <span data-testid="imc">IMC = {arrondi(ev.imc.imc)}</span> - {ev.imc.interpretation.message}
          </Resultat>
        ) : (
          <p className={styles.incomplet} data-testid="imc">{RAISONS_IMC[ev.imc.raison]}</p>
        )}
      </>
    );
  },

  'pression-arterielle': ({ session, dispatch, evaluation: ev, scores }) => {
    const lignes = session.tests.pa;
    const maj = (i: number, l: Partial<LignePa>) => dispatch({ type: 'pa', lignes: lignes.map((x, j) => (j === i ? { ...x, ...l } : x)) });
    return (
      <>
        <p className={styles.aide}>
          Au moins {scores.pressionArterielle.mesuresMin} mesures, au repos depuis 3 à 5 minutes. La première fois, mesurer aux deux bras : le bras le plus haut est retenu.
        </p>
        <table className={styles.tableauPa}>
          <thead>
            <tr><th scope="col">Mesure</th><th scope="col">Bras</th><th scope="col">Systolique (mmHg)</th><th scope="col">Diastolique (mmHg)</th><th scope="col"><span className={styles.masque}>Action</span></th></tr>
          </thead>
          <tbody>
            {lignes.map((l, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>
                  <select aria-label={`Bras de la mesure ${i + 1}`} value={l.bras} onChange={(e) => maj(i, { bras: e.target.value as LignePa['bras'] })}>
                    <option value="gauche">Gauche</option>
                    <option value="droit">Droit</option>
                  </select>
                </td>
                {(['systolique', 'diastolique'] as const).map((k) => (
                  <td key={k}>
                    <input
                      aria-label={`${k === 'systolique' ? 'Systolique' : 'Diastolique'} mesure ${i + 1}`}
                      type="number"
                      inputMode="numeric"
                      defaultValue={l[k] ?? ''}
                      onChange={(e) => maj(i, { [k]: e.target.value === '' ? null : Number(e.target.value) })}
                    />
                  </td>
                ))}
                <td>
                  {lignes.length > 1 && (
                    <button type="button" className={styles.boutonLien} onClick={() => dispatch({ type: 'pa', lignes: lignes.filter((_, j) => j !== i) })}>
                      Supprimer
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" className={styles.boutonSecondaire} onClick={() => dispatch({ type: 'pa', lignes: [...lignes, { bras: lignes.at(-1)?.bras ?? 'gauche', systolique: null, diastolique: null }] })}>
          Ajouter une mesure
        </button>
        {ev.pa.complet ? (
          <Resultat niveau={ev.pa.niveau}>
            <span data-testid="pa-retenue">PA retenue : {arrondi(ev.pa.retenue.systolique)}/{arrondi(ev.pa.retenue.diastolique)} mmHg</span> (bras {ev.pa.retenue.bras}, {ev.pa.retenue.nbMesures} mesure{ev.pa.retenue.nbMesures > 1 ? 's' : ''})
            {ev.pa.message && <> - {ev.pa.message}</>}
          </Resultat>
        ) : ev.pa.raison === 'mesure-invalide' ? (
          <p className={styles.incomplet}>Mesure {ev.pa.index + 1} invalide : la systolique doit être supérieure à la diastolique.</p>
        ) : (
          <p className={styles.incomplet}>{ev.pa.nbMesures} mesure(s) complète(s) sur {ev.pa.mesuresMin} requises.</p>
        )}
      </>
    );
  },

  face: ({ scores, session, dispatch, evaluation: ev }) => (
    <>
      {ev.reperesAlcool && (
        <Resultat niveau={ev.reperesAlcool.niveau}>{ev.reperesAlcool.message}</Resultat>
      )}
      {scores.face.items.map((it, i) => (
        <ItemCote key={it.id} nom={`face-${it.id}`} libelle={`${i + 1}. ${it.libelle}`} options={it.options} valeur={session.tests.face[it.id]} onChange={(p) => dispatch({ type: 'face', item: it.id, points: p })} />
      ))}
      {ev.face.complet ? (
        <Resultat niveau={ev.face.interpretation.niveau}>
          <span data-testid="score-face">Score FACE : {ev.face.score}</span> - {ev.face.interpretation.message}
          {ev.face.avertissementGenre && <p className={styles.aide}>{ev.face.avertissementGenre}</p>}
        </Resultat>
      ) : (
        <Incomplet manquants={ev.face.manquants.length} />
      )}
    </>
  ),

  fagerstrom: ({ scores, session, dispatch, evaluation: ev }) => {
    const [cig, delai] = scores.fagerstrom.items;
    return (
      <>
        <ChampNombre
          libelle="Aide : nombre de cigarettes par jour"
          onChange={(n) => {
            const p = n === undefined ? undefined : pointsCigarettesParJour(n, scores.fagerstrom) ?? undefined;
            dispatch({ type: 'fagerstrom', item: 'cigarettesParJour', points: p });
          }}
          valeur={undefined}
          pas={1}
        />
        {[cig!, delai!].map((it, i) => (
          <ItemCote key={it.id} nom={`fag-${it.id}`} libelle={`${i + 1}. ${it.libelle}`} options={it.options} valeur={session.tests.fagerstrom[it.id]} onChange={(p) => dispatch({ type: 'fagerstrom', item: it.id, points: p })} />
        ))}
        {ev.fagerstrom.complet ? (
          <Resultat niveau={ev.fagerstrom.interpretation.niveau}>
            <span data-testid="score-fagerstrom">Score : {ev.fagerstrom.score}</span> - {ev.fagerstrom.interpretation.message}
          </Resultat>
        ) : (
          <Incomplet manquants={ev.fagerstrom.manquants.length} />
        )}
      </>
    );
  },

  cast: ({ scores, session, dispatch, evaluation: ev }) => (
    <>
      {scores.cast.items.map((it, i) => (
        <fieldset key={it.id} className={styles.groupeFiche}>
          <legend>{i + 1}. {it.libelle}</legend>
          <div className={styles.optionsLigne}>
            {[true, false].map((oui) => (
              <label key={String(oui)} className={styles.option}>
                <input type="radio" name={`cast-${it.id}`} checked={session.tests.cast[it.id] === oui} onChange={() => dispatch({ type: 'cast', item: it.id, oui })} />
                {oui ? 'Oui' : 'Non'}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {ev.cast.complet ? (
        <Resultat niveau={ev.cast.interpretation.niveau}>
          <span data-testid="score-cast">Réponses positives : {ev.cast.score}</span> - {ev.cast.interpretation.message}
        </Resultat>
      ) : (
        <Incomplet manquants={ev.cast.manquants.length} />
      )}
    </>
  ),

  had: ({ scores, session, dispatch, evaluation: ev }) => (
    <>
      {scores.had.items.map((it) => (
        <ItemCote key={it.id} nom={`had-${it.id}`} libelle={`${it.id.slice(1)}. ${it.libelle}`} options={it.options} valeur={session.tests.had[it.id]} onChange={(p) => dispatch({ type: 'had', item: it.id, points: p })} />
      ))}
      {ev.had.map((d) =>
        d.complet ? (
          <Resultat key={d.dimension} niveau={d.interpretation.niveau}>
            <span data-testid={`score-had-${d.dimension}`}>{d.libelle} = {d.score}</span> - {d.interpretation.message}
          </Resultat>
        ) : (
          <p key={d.dimension} className={styles.incomplet}>{d.libelle} : {d.manquants.length} réponse(s) manquante(s).</p>
        ),
      )}
      <p className={styles.aide}>{scores.had.complement}</p>
    </>
  ),
};
