import { useEffect, useRef, useState } from 'react';
import { construireDocument } from '../logic/document';
import { verifierFacturation } from '../logic/facturation';
import { formaterDateIso } from '../logic/age';
import type { PropsEtape } from './Parcours';
import styles from './Parcours.module.css';

/** Clôture : contrôle de facturation (S2), export PDF (M14), puis clôture et purge de la session (M15). */
export function Cloture(props: PropsEtape & { onCloturer: () => void }) {
  const { session, tranche, scores, orientation, evaluation, dispatch, onCloturer } = props;
  const f = scores.facturation;
  const controle = verifierFacturation(session.actesComplementaires, f);
  const modele = construireDocument(session, evaluation, tranche, scores, orientation, formaterDateIso(new Date()));
  const [etat, setEtat] = useState<'pret' | 'en-cours' | 'fait' | 'erreur'>('pret');
  const urls = useRef<string[]>([]);

  // Les URL de PDF (blob) sont révoquées au démontage : le document ne reste pas en mémoire.
  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);

  const exporter = async () => {
    setEtat('en-cours');
    try {
      const [{ genererPdf }, { POLICES }] = await Promise.all([import('../pdf/generer'), import('../pdf/polices')]);
      const blob = await genererPdf(modele, POLICES);
      const url = URL.createObjectURL(blob);
      urls.current.push(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = modele.nomFichier;
      a.click();
      setEtat('fait');
    } catch {
      setEtat('erreur');
    }
  };

  return (
    <div>
      <h2 className={styles.titreEtape}>Clôture du bilan</h2>

      <section className={styles.section} aria-labelledby="mbp-facturation">
        <h3 id="mbp-facturation" className={styles.titreSection}>Récapitulatif de facturation</h3>
        <p>
          <strong>{f.acteBilan.code}</strong> - {f.acteBilan.libelle} : {f.acteBilan.montantEuros} €
          <span className={styles.aide}> ({f.acteBilan.rappel})</span>
        </p>
        <fieldset className={styles.groupeFiche}>
          <legend>Acte complémentaire facturé en sus (au plus {f.maxActesComplementaires})</legend>
          {f.actesComplementaires.map((a) => (
            <label key={a.code} className={styles.option}>
              <input type="checkbox" checked={session.actesComplementaires.includes(a.code)} onChange={(e) => dispatch({ type: 'acte', code: a.code, coche: e.target.checked })} />
              {a.code} - {a.libelle}
            </label>
          ))}
        </fieldset>
        {!controle.valide && (
          <div role="alert" className={styles.bandeauRouge} data-testid="facturation-bloquante">
            {controle.erreurs.map((e) => <p key={e}>{e}</p>)}
          </div>
        )}
        <p className={styles.aide}>Récapitulatif non conservé : la facture est établie dans le logiciel d’officine.</p>
      </section>

      <section className={styles.section} aria-labelledby="mbp-export">
        <h3 id="mbp-export" className={styles.titreSection}>Export PDF (fiche de repérage et PPP)</h3>
        {modele.incomplet.length > 0 && (
          <p className={styles.incomplet} data-testid="avertissement-incomplet">
            Le PDF portera la mention « INCOMPLET » : {modele.incomplet.join(', ')}.
          </p>
        )}
        <p className={styles.aide}>
          Transmission au médecin traitant : {session.ppp.opposition ? 'le patient s’y oppose (mention portée sur le PPP).' : 'pas d’opposition du patient.'}
        </p>
        <button type="button" className={styles.boutonPrincipal} disabled={!controle.valide || etat === 'en-cours'} onClick={() => void exporter()}>
          {etat === 'en-cours' ? 'Génération du PDF…' : 'Exporter le PDF'}
        </button>
        {!controle.valide && <p className={styles.incomplet}>Corriger la facturation pour exporter.</p>}
        {etat === 'fait' && <p role="status">PDF généré : {modele.nomFichier}. Déposer le fichier dans le logiciel d’officine, puis clôturer la session.</p>}
        {etat === 'erreur' && <p role="alert" className={styles.bandeauRouge}>La génération du PDF a échoué. Réessayer ; aucune donnée n’a été envoyée.</p>}
        <p className={styles.aide}>Le PDF est généré sur cet appareil : aucune donnée n’est envoyée sur le réseau.</p>
      </section>

      <section className={styles.section}>
        <p className={styles.aide}>La clôture efface toutes les données de la session de cet appareil.</p>
        <button type="button" className={styles.boutonSecondaire} onClick={onCloturer}>Clôturer la session</button>
      </section>
    </div>
  );
}
