import type { ReferentielTranche } from '../referentiels/schemas';
import type { DonneesOuverture } from './OuvertureSession';
import styles from './Session.module.css';

export function SessionOuverte({
  session,
  referentiel,
  onCloturer,
}: {
  session: DonneesOuverture;
  referentiel: ReferentielTranche;
  onCloturer: () => void;
}) {
  const sourceTests = referentiel.testsApplicables.source;
  const documentTests = referentiel.sources.find((s) => s.id === sourceTests.ref)?.document ?? sourceTests.ref;
  const genre = referentiel.ouvertureSession.genres.find((g) => g.id === session.genre)?.libelle ?? session.genre;

  return (
    <section className={styles.carte} aria-labelledby="mbp-session-titre">
      <h2 id="mbp-session-titre" className={styles.titre}>
        Bilan Prévention {referentiel.tranche.libelle}
      </h2>
      <dl className={styles.resume}>
        <dt>Âge au rendez-vous</dt>
        <dd>{session.age} ans</dd>
        <dt>Genre</dt>
        <dd>{genre}</dd>
        <dt>Référentiel</dt>
        <dd data-testid="version-referentiel">
          {referentiel.tranche.id} v{referentiel.version}
          {referentiel.dateValidation ? (
            ` - validé le ${referentiel.dateValidation}`
          ) : (
            <span className={styles.badgeAVerifier}>non validé par le pharmacien référent</span>
          )}
        </dd>
      </dl>

      <h3 className={styles.sousTitre}>Tests applicables</h3>
      <ul className={styles.liste}>
        {referentiel.testsApplicables.items.map((t) => (
          <li key={t.id}>
            {t.libelle}
            {t.aVerifier && <span className={styles.badgeAVerifier}>à vérifier</span>}
          </li>
        ))}
      </ul>
      <p className={styles.source}>Source : {documentTests}, p. {sourceTests.page}</p>

      <button type="button" className={styles.boutonSecondaire} onClick={onCloturer}>
        Clôturer la session
      </button>
    </section>
  );
}
