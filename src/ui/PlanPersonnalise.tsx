import { useState } from 'react';
import { construirePpp, ajouterSuggestion, type LignePpp } from '../logic/ppp';
import type { ColonnePpp } from '../logic/session';
import type { PropsEtape } from './Parcours';
import { BoutonFiche } from './PanneauFiche';
import styles from './Parcours.module.css';

/** Plan Personnalisé de Prévention (M13) : 4 colonnes pré-remplies et modifiables, modalités de suivi. */
export function PlanPersonnalise(props: PropsEtape) {
  const { session, tranche, scores, orientation, evaluation, dispatch } = props;
  const p = orientation.ppp;
  const lignes = construirePpp(session, evaluation, tranche, scores, orientation);
  const col = (id: string) => p.colonnes.find((c) => c.id === id)!;

  return (
    <div>
      <h2 className={styles.titreEtape}>{p.titre}</h2>
      <p className={styles.aide}>{p.sousTitre}</p>
      {lignes.length === 0 ? (
        <p className={styles.incomplet}>Aucune priorité choisie : revenir à l’étape « Décision partagée ».</p>
      ) : (
        lignes.map((l) => <LignePlan key={l.thematique} ligne={l} col={col} {...props} />)
      )}
      <section className={styles.section}>
        <label className={styles.champTexte}>
          <span className={styles.titreSection}>{p.modalitesSuivi}</span>
          <textarea className={styles.zoneTexte} defaultValue={session.ppp.modalitesSuivi} onChange={(e) => dispatch({ type: 'modalitesSuivi', texte: e.target.value })} />
        </label>
        <p className={styles.aide}>{p.encouragement}</p>
      </section>
      <p className={styles.aide}>{p.colonnes.filter((c) => c.note).map((c) => `${c.libelle} : ${c.note}`).join(' ')}</p>
      <p className={styles.aide}>Kit d’orientation : {orientation.kit.avertissement}</p>
    </div>
  );
}

function LignePlan({
  ligne: l,
  col,
  dispatch,
  ouvrirFiche,
}: PropsEtape & { ligne: LignePpp; col: (id: string) => { libelle: string } }) {
  const maj = (colonne: ColonnePpp, texte: string) => dispatch({ type: 'cellulePpp', thematique: l.thematique, colonne, texte });
  return (
    <section className={styles.lignePpp} aria-label={`${col('priorite').libelle} : ${l.libelle}`} data-ppp={l.thematique}>
      <div className={styles.cellulePriorite}>
        <span className={styles.libelleColonne}>{col('priorite').libelle}</span>
        <strong>{l.libelle}</strong>
        {l.motif && <span className={styles.badgeAVerifier}>{l.motif}</span>}
        <BoutonFiche thematique={l.thematique} libelle={l.libelle} ouvrir={ouvrirFiche} />
      </div>
      <Cellule libelle={col('freins').libelle} valeur={l.freins} suggestions={l.suggestionsFreins} onChange={(t) => maj('freins', t)} />
      <Cellule libelle={col('conseils').libelle} valeur={l.conseils} suggestions={l.suggestionsConseils} onChange={(t) => maj('conseils', t)} />
      <Cellule
        libelle={col('ressources').libelle}
        valeur={l.ressources}
        suggestions={[]}
        onChange={(t) => maj('ressources', t)}
        note={l.sansKit ? 'Aucune ressource pharmacien pour cette thématique dans le kit d’orientation.' : undefined}
      />
    </section>
  );
}

/**
 * Cellule de texte libre : contrôlée par la session, pour que les suggestions cliquées s'ajoutent
 * immédiatement au texte saisi.
 */
function Cellule({
  libelle,
  valeur,
  suggestions,
  onChange,
  note,
}: {
  libelle: string;
  valeur: string;
  suggestions: readonly string[];
  onChange: (t: string) => void;
  note?: string | undefined;
}) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className={styles.cellulePpp}>
      <label className={styles.champTexte}>
        <span className={styles.libelleColonne}>{libelle}</span>
        <textarea className={styles.zoneTexte} rows={Math.max(4, valeur.split('\n').length + 1)} value={valeur} onChange={(e) => onChange(e.target.value)} />
      </label>
      {note && <p className={styles.aide}>{note}</p>}
      {suggestions.length > 0 && (
        <div>
          <button type="button" className={styles.boutonLien} aria-expanded={ouvert} onClick={() => setOuvert(!ouvert)}>
            Suggestions ({suggestions.length})
          </button>
          {ouvert && (
            <ul className={styles.suggestions}>
              {suggestions.map((s) => (
                <li key={s}>
                  <button type="button" className={styles.suggestion} onClick={() => onChange(ajouterSuggestion(valeur, s))}>
                    + {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
