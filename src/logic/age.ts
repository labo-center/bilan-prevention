/** Date calendaire sans heure ni fuseau, pour éviter tout décalage lié au fuseau horaire. */
export interface DateCalendaire {
  annee: number;
  mois: number; // 1-12
  jour: number; // 1-31
}

/** Parse une date "AAAA-MM-JJ" (format des champs <input type="date">). Retourne null si invalide. */
export function parserDateIso(valeur: string): DateCalendaire | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valeur);
  if (!m) return null;
  const annee = Number(m[1]);
  const mois = Number(m[2]);
  const jour = Number(m[3]);
  if (mois < 1 || mois > 12 || jour < 1) return null;
  const joursDansLeMois = new Date(Date.UTC(annee, mois, 0)).getUTCDate();
  if (jour > joursDansLeMois) return null;
  return { annee, mois, jour };
}

/** Formate une Date locale en "AAAA-MM-JJ". */
export function formaterDateIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export type ResultatAge =
  | { ok: true; age: number }
  | { ok: false; erreur: 'date-naissance-invalide' | 'date-rdv-invalide' | 'naissance-apres-rdv' };

/**
 * Âge révolu (en années entières) à la date du rendez-vous.
 * Une personne née un 29 février a un an de plus le 1er mars des années non bissextiles.
 */
export function calculerAge(dateNaissance: string, dateRdv: string): ResultatAge {
  const n = parserDateIso(dateNaissance);
  if (!n) return { ok: false, erreur: 'date-naissance-invalide' };
  const r = parserDateIso(dateRdv);
  if (!r) return { ok: false, erreur: 'date-rdv-invalide' };

  const cle = (d: DateCalendaire) => d.annee * 10000 + d.mois * 100 + d.jour;
  if (cle(n) > cle(r)) return { ok: false, erreur: 'naissance-apres-rdv' };

  let age = r.annee - n.annee;
  const anniversairePasse = r.mois > n.mois || (r.mois === n.mois && r.jour >= n.jour);
  if (!anniversairePasse) age -= 1;
  return { ok: true, age };
}
