import { useId, useState, type FormEvent } from 'react';
import { calculerAge, formaterDateIso, type ResultatAge } from '../logic/age';
import { selectionnerTranche } from '../logic/tranche';
import type { ReferentielTranche } from '../referentiels/schemas';
import styles from './Session.module.css';

export interface DonneesOuverture {
  dateRdv: string;
  dateNaissance: string;
  genre: string;
  age: number;
  trancheId: string;
}

const MESSAGES_ERREUR_AGE: Record<Extract<ResultatAge, { ok: false }>['erreur'], string> = {
  'date-naissance-invalide': 'Date de naissance invalide.',
  'date-rdv-invalide': 'Date du rendez-vous invalide.',
  'naissance-apres-rdv': 'La date de naissance est postérieure à la date du rendez-vous.',
};

type Retour = { type: 'erreur'; message: string } | { type: 'hors-tranche'; age: number } | null;

export function OuvertureSession({
  tranches,
  onOuvrir,
}: {
  tranches: ReferentielTranche[];
  onOuvrir: (d: DonneesOuverture) => void;
}) {
  const id = useId();
  const [dateRdv, setDateRdv] = useState(() => formaterDateIso(new Date()));
  const [dateNaissance, setDateNaissance] = useState('');
  const [genre, setGenre] = useState('');
  const [retour, setRetour] = useState<Retour>(null);

  // Les options de genre sont communes aux fiches de repérage : on lit celles de la première tranche chargée.
  const genres = tranches[0]?.ouvertureSession.genres ?? [];

  const valider = (e: FormEvent) => {
    e.preventDefault();
    const r = calculerAge(dateNaissance, dateRdv);
    if (!r.ok) return setRetour({ type: 'erreur', message: MESSAGES_ERREUR_AGE[r.erreur] });
    if (!genre) return setRetour({ type: 'erreur', message: 'Indiquer le genre (ou "Ne souhaite pas répondre").' });
    const ref = selectionnerTranche(r.age, tranches.map((t) => t.tranche));
    if (!ref) return setRetour({ type: 'hors-tranche', age: r.age });
    setRetour(null);
    onOuvrir({ dateRdv, dateNaissance, genre, age: r.age, trancheId: ref.id });
  };

  return (
    <form className={styles.carte} onSubmit={valider} noValidate aria-labelledby={`${id}-titre`}>
      <h2 id={`${id}-titre`} className={styles.titre}>Ouverture de session</h2>

      <div className={styles.champ}>
        <label htmlFor={`${id}-rdv`}>Date du rendez-vous</label>
        <input id={`${id}-rdv`} type="date" value={dateRdv} onChange={(e) => setDateRdv(e.target.value)} required />
      </div>

      <div className={styles.champ}>
        <label htmlFor={`${id}-naissance`}>Date de naissance</label>
        <input
          id={`${id}-naissance`}
          type="date"
          value={dateNaissance}
          onChange={(e) => setDateNaissance(e.target.value)}
          required
        />
      </div>

      <fieldset className={styles.groupe}>
        <legend>Genre</legend>
        {genres.map((g) => (
          <label key={g.id} className={styles.option}>
            <input type="radio" name={`${id}-genre`} value={g.id} checked={genre === g.id} onChange={() => setGenre(g.id)} />
            {g.libelle}
          </label>
        ))}
      </fieldset>

      {retour?.type === 'erreur' && (
        <p role="alert" className={styles.alerteOrange}>{retour.message}</p>
      )}
      {retour?.type === 'hors-tranche' && (
        <div role="alert" className={styles.alerteRouge}>
          <strong>Hors tranche Bilan Prévention</strong>
          <p>
            Âge à la date du rendez-vous : {retour.age} ans. Tranche(s) prise(s) en charge :{' '}
            {tranches.map((t) => t.tranche.libelle).join(', ')} (bornes incluses).
          </p>
        </div>
      )}

      <button type="submit" className={styles.boutonPrincipal}>Ouvrir la session</button>
    </form>
  );
}
