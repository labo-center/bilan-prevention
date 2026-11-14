import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import type { ModeleDocument, SectionDocument } from '../logic/document';

/*
 * Mise en page du PDF (A4). @react-pdf n'utilise pas le CSS du navigateur : ces styles sont
 * propres au document imprimé et ne passent pas par tokens.css.
 */
const COULEUR_TRAIT = '#9aa3ad';
const COULEUR_SECONDAIRE = '#4a535d';
const COULEUR_ALERTE = '#b3261e';
const s = StyleSheet.create({
  page: { fontFamily: 'MBP', fontSize: 9, paddingTop: 32, paddingBottom: 48, paddingHorizontal: 36 },
  titre: { fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  sousTitre: { fontSize: 9, color: COULEUR_SECONDAIRE, marginBottom: 8 },
  incomplet: { borderWidth: 1.5, borderColor: COULEUR_ALERTE, color: COULEUR_ALERTE, padding: 6, marginBottom: 8, fontWeight: 'bold' },
  section: { marginBottom: 8 },
  titreSection: { fontSize: 10.5, fontWeight: 'bold', borderBottomWidth: 0.75, borderBottomColor: COULEUR_TRAIT, marginBottom: 3, paddingBottom: 1 },
  ligne: { flexDirection: 'row', marginBottom: 1.5 },
  libelle: { width: '45%', color: COULEUR_SECONDAIRE, paddingRight: 6 },
  valeur: { width: '55%' },
  marque: { fontSize: 7.5, color: COULEUR_SECONDAIRE },
  tableau: { borderWidth: 0.75, borderColor: COULEUR_TRAIT, marginBottom: 8 },
  rangee: { flexDirection: 'row', borderBottomWidth: 0.75, borderBottomColor: COULEUR_TRAIT },
  entete: { fontWeight: 'bold', backgroundColor: '#eef1f4' },
  cellule: { width: '25%', padding: 4, borderRightWidth: 0.75, borderRightColor: COULEUR_TRAIT },
  opposition: { marginTop: 6 },
  mention: { marginTop: 6, fontWeight: 'bold', color: COULEUR_ALERTE },
  note: { fontSize: 7.5, color: COULEUR_SECONDAIRE, marginTop: 2 },
  pied: { position: 'absolute', bottom: 18, left: 36, right: 36, fontSize: 7, color: COULEUR_SECONDAIRE },
});

function Section({ section }: { section: SectionDocument }) {
  return (
    <View style={s.section} wrap={false}>
      <Text style={s.titreSection}>{section.titre}</Text>
      {section.lignes.map((l, i) => (
        <View key={i} style={s.ligne}>
          <Text style={s.libelle}>{l.libelle}</Text>
          <Text style={s.valeur}>
            {l.valeur}
            {l.declare && <Text style={s.marque}> (déclaré par le patient)</Text>}
            {l.aVerifier && <Text style={s.marque}> (à vérifier)</Text>}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Pied de page statique, répété sur chaque page. Pas de numéro de page calculé : dans @react-pdf,
 * le calcul du nombre total de pages relance une mise en page qui casse le tableau du PPP.
 */
function Pied({ texte, section }: { texte: string; section: string }) {
  return (
    <View style={s.pied} fixed>
      <Text>{`${section} - ${texte}`}</Text>
    </View>
  );
}

/** PDF en 2 sections (M14) : fiche d'aide au repérage complétée, puis Plan Personnalisé de Prévention. */
export function DocumentBilan({ modele: m }: { modele: ModeleDocument }) {
  const incomplet = m.incomplet.length > 0 && (
    <Text style={s.incomplet}>INCOMPLET - calcul obligatoire manquant : {m.incomplet.join(', ')}</Text>
  );
  return (
    <Document title={m.titreFiche} language="fr">
      <Page size="A4" style={s.page}>
        <Text style={s.titre}>{m.titreFiche}</Text>
        {incomplet}
        {m.sectionsFiche.map((sec, i) => <Section key={i} section={sec} />)}
        <Section section={m.resultatsTests} />
        <View style={s.section}>
          <Text style={s.titreSection}>Décision partagée - thématique(s) priorisée(s) pour l’intervention brève</Text>
          {m.priorites.length === 0 ? <Text>Aucune</Text> : m.priorites.map((p, i) => <Text key={i}>{i + 1}. {p}</Text>)}
        </View>
        <Pied texte={m.piedDePage} section="Fiche de repérage" />
      </Page>
      <Page size="A4" orientation="landscape" style={s.page}>
        <Text style={s.titre}>{m.ppp.titre}</Text>
        <Text style={s.sousTitre}>{m.ppp.sousTitre}</Text>
        {incomplet}
        <View style={s.tableau}>
          <View style={[s.rangee, s.entete]}>
            {m.ppp.colonnes.map((c) => <Text key={c} style={s.cellule}>{c}</Text>)}
          </View>
          {m.ppp.lignes.map((l, i) => (
            <View key={i} style={s.rangee} wrap={false}>
              <Text style={s.cellule}>
                {l.priorite}
                {l.motif && <Text style={s.marque}>{`\n${l.motif}`}</Text>}
              </Text>
              <Text style={s.cellule}>{l.freins}</Text>
              <Text style={s.cellule}>{l.conseils}</Text>
              <Text style={s.cellule}>{l.ressources}</Text>
            </View>
          ))}
        </View>
        <Text style={s.titreSection}>{m.ppp.titreModalites}</Text>
        <Text>{m.ppp.modalitesSuivi || ' '}</Text>
        <Text style={s.note}>{m.ppp.encouragement}</Text>
        <Text style={s.opposition}>[{m.ppp.opposition.coche ? 'X' : ' '}] {m.ppp.opposition.libelle}</Text>
        {m.ppp.mentionOpposition && <Text style={s.mention}>{m.ppp.mentionOpposition}</Text>}
        {m.ppp.notes.map((n, i) => <Text key={i} style={s.note}>{i + 1} {n}</Text>)}
        <Pied texte={m.piedDePage} section="Plan Personnalisé de Prévention" />
      </Page>
    </Document>
  );
}
