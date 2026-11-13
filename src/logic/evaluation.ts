import type { ReferentielScores } from '../referentiels/schemaScores';
import type { ReferentielTranche } from '../referentiels/schemas';
import { calculerCast, type ResultatCast } from './cast';
import { depistagesApplicables, type Depistage } from './depistages';
import { calculerFace, type ResultatFace } from './face';
import { calculerFagerstrom, type ResultatFagerstrom } from './fagerstrom';
import { calculerHad, type ResultatDimensionHad } from './had';
import { calculerImc, type ResultatImc } from './imc';
import { evaluerPa, type MesurePa, type ResultatPa } from './pa';
import { dedoublonner, trierRisques, type Risque } from './risques';
import type { Session } from './session';
import {
  evaluerIdeesSuicidaires, evaluerMedecinTraitant, evaluerPolymedication, evaluerReperesAlcool,
} from './situations';
import type { Interpretation } from './types';

export interface EvaluationSession {
  imc: ResultatImc;
  pa: ResultatPa;
  face: ResultatFace;
  fagerstrom: ResultatFagerstrom;
  cast: ResultatCast;
  had: ResultatDimensionHad[];
  reperesAlcool: ReturnType<typeof evaluerReperesAlcool>;
  polymedication: Interpretation | null;
  ideesSuicidaires: ReturnType<typeof evaluerIdeesSuicidaires>;
  medecinTraitant: Interpretation | null;
  depistages: Depistage[];
  /** Risques triés rouge > orange > info. */
  risques: Risque[];
  /** Alertes bloquantes non encore acquittées. */
  alertesBloquantes: Risque[];
}

const nombre = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);

/** Évalue toutes les règles sur la session et construit la liste des risques repérés. Fonction pure. */
export function evaluerSession(session: Session, tranche: ReferentielTranche, scores: ReferentielScores): EvaluationSession {
  const { fiche, tests, ouverture } = session;
  const lien = tranche.liaisons;
  const val = (champ: string) => fiche[champ]?.valeur;
  const docs = new Map(scores.sources.map((s) => [s.id, s.document]));
  const src = (s: { ref: string; page: string }) => `${docs.get(s.ref) ?? s.ref}, p. ${s.page}`;

  const mesures: MesurePa[] = tests.pa.flatMap((l) =>
    l.systolique !== null && l.diastolique !== null ? [{ bras: l.bras, systolique: l.systolique, diastolique: l.diastolique }] : [],
  );

  const brutAlcool = session.autoquestionnaire.reponses[lien.questionReperesAlcool];
  const reponsesAlcool: readonly string[] = Array.isArray(brutAlcool) ? brutAlcool : [];

  const ev = {
    imc: calculerImc({ tailleM: nombre(val(lien.taille)), poidsKg: nombre(val(lien.poids)) }, scores.imc),
    pa: evaluerPa(mesures, scores.pressionArterielle),
    face: calculerFace(tests.face, ouverture.genre, scores.face),
    fagerstrom: calculerFagerstrom(tests.fagerstrom, scores.fagerstrom),
    cast: calculerCast(tests.cast, scores.cast),
    had: calculerHad(tests.had, scores.had),
    reperesAlcool: evaluerReperesAlcool(
      Object.fromEntries(scores.reperesAlcool.reperes.map((r) => [r.id, reponsesAlcool.includes(r.id)])),
      scores.reperesAlcool,
    ),
    polymedication: evaluerPolymedication(nombre(val(lien.nombreTraitements)), scores.polymedication),
    ideesSuicidaires: evaluerIdeesSuicidaires(val(lien.ideesSuicidaires) === true, scores.ideesSuicidaires),
    medecinTraitant: evaluerMedecinTraitant(
      val(lien.medecinTraitant) === 'oui' ? true : val(lien.medecinTraitant) === 'non' ? false : undefined,
      scores.medecinTraitant,
    ),
    depistages: depistagesApplicables(
      {
        age: ouverture.age,
        genre: ouverture.genre,
        risqueEleve: {
          colorectal: val(lien.risqueEleveColorectal) === true,
          sein: val(lien.risqueEleveSein) === true,
        },
      },
      scores.depistages,
    ),
  };

  const risques: Risque[] = [];
  const ajouter = (id: string, theme: string, i: Interpretation | null, source: string, bloquant = false) => {
    if (i && i.niveau !== 'aucun') risques.push({ id, theme, niveau: i.niveau, source, message: i.message, aVerifier: i.aVerifier, bloquant });
  };

  // Règles de scores.json. Les risques liés à un champ de la fiche reprennent l'id du champ (dédoublonnage).
  ajouter(lien.ideesSuicidaires, scores.ideesSuicidaires.siCoche.thematique, ev.ideesSuicidaires, src(scores.ideesSuicidaires.source));
  if (ev.pa.complet && ev.pa.message) {
    ajouter('pa', scores.pressionArterielle.thematique, { niveau: ev.pa.niveau, message: ev.pa.message, aVerifier: false }, src(scores.pressionArterielle.source), ev.pa.bloquant);
  }
  if (ev.imc.calculable) {
    const imcTexte = String(ev.imc.imc).replace('.', ',');
    ajouter('imc', scores.imc.thematique, { ...ev.imc.interpretation, message: `IMC ${imcTexte} : ${ev.imc.interpretation.message}` }, src(scores.imc.source));
  }
  ajouter('reperes-alcool', scores.reperesAlcool.thematique, ev.reperesAlcool, src(scores.reperesAlcool.source));
  if (ev.face.complet) ajouter('face', scores.face.thematique, ev.face.interpretation, src(scores.face.source));
  if (ev.fagerstrom.complet) ajouter('fagerstrom', scores.fagerstrom.thematique, ev.fagerstrom.interpretation, src(scores.fagerstrom.source));
  if (ev.cast.complet) ajouter('cast', scores.cast.thematique, ev.cast.interpretation, src(scores.cast.source));
  for (const d of ev.had) {
    if (d.complet) ajouter(`had-${d.dimension}`, scores.had.thematique, { ...d.interpretation, message: `${d.libelle} : ${d.interpretation.message}` }, src(scores.had.source));
  }
  ajouter(lien.polymedication, scores.polymedication.thematique, ev.polymedication, src(scores.polymedication.source));
  ajouter(lien.medecinTraitant, scores.medecinTraitant.thematique, ev.medecinTraitant, src(scores.medecinTraitant.source));
  for (const d of ev.depistages) {
    ajouter(`depistage-${d.id}`, scores.depistages.thematique, { niveau: 'info', message: `${d.libelle} : ${d.modalite}`, aVerifier: false }, src(scores.depistages.source));
  }

  // Champs de la fiche signalés comme risques.
  for (const section of tranche.ficheReperage.sections) {
    for (const c of section.champs) {
      if (!c.risque) continue;
      const e = fiche[c.id];
      const renseigne = c.type === 'case' ? e?.valeur === true : e?.valeur !== undefined && e.valeur !== '' && e.valeur !== false;
      const theme = c.thematique ?? section.thematique;
      if (!renseigne || !theme) continue;
      const detail = c.type === 'choix' ? c.options.find((o) => o.id === e?.valeur)?.libelle : undefined;
      risques.push({
        id: c.id,
        theme,
        niveau: 'info',
        source: e?.origine === 'declare_patient' ? 'Déclaré par le patient' : 'Fiche de repérage',
        message: detail ? `${c.libelle} : ${detail}` : c.libelle,
        aVerifier: e?.aVerifier ?? false,
        bloquant: false,
      });
    }
  }

  const tries = trierRisques(dedoublonner(risques));
  return {
    ...ev,
    risques: tries,
    alertesBloquantes: tries.filter((r) => r.bloquant && !tests.acquittements.includes(r.id)),
  };
}
