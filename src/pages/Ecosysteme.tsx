// src/pages/Ecosysteme.tsx — US-E2 / V-03, l'observatoire du réseau généré.
//
// CE QUE CET ÉCRAN MONTRE, ET QUE LA PLATEFORME NE PEUT PAS MONTRER
// ------------------------------------------------------------------
// `org_hierarchy` est À NOUS. Branche et Agence n'existent NULLE PART
// ailleurs : company-service n'a aucune route pour elles, et son enum
// `CompanyType` ne comporte pas de valeur `BRANCH`. Même pour ce qui est réel,
// le LIEN n'existe que chez nous : `User` porte `company_id` mais jamais de
// référence vers un Dépositaire, et la fiche Client rendue par la plateforme
// porte quinze clés dont AUCUNE ne permet un rattachement. Sans cet arbre, les
// questions « quels agents dans ce kiosque ? » et « quels clients ? » n'ont
// aucune réponse — et `CR-02` reste invérifiable.
//
// TROIS OBJETS, TROIS QUESTIONS (refonte du 24/08)
// ------------------------------------------------
//   les mesures   « est-ce CRÉDIBLE ? »  — un compteur dit combien, jamais si
//                 le réseau tient devant un bailleur
//   la charge     « est-ce ÉQUILIBRÉ ? » — la surface EST la quantité : une
//                 institution démesurée se voit sans lire un chiffre. Un arbre
//                 ne le montre jamais, il faut comparer des nombres de tête
//   l'arbre       « QUI est là ? »       — cinq niveaux, chaque ligne portant
//                 ses agrégats : on ne déplie jamais pour savoir ce qu'il y a
//                 dessous
//
// CE QU'ON N'AFFICHE PAS, ET C'EST UNE DÉCISION
// ---------------------------------------------
//   les 2000 clients dans l'arbre — ils n'y rentrent pas et personne ne les
//     lirait ; le kiosque porte un lien vers l'écran clients FILTRÉ sur lui
//   l'état vivant/mort des services — le tableau de bord le dit déjà, en vert
//     et rouge et EN DIRECT ; le répéter finirait par se contredire
//   un nom inventé pour un identifiant inconnu — le backend rend
//     l'identifiant brut, et l'écran l'affiche tel quel : le maquiller
//     masquerait une géographie qui a bougé sous l'arbre
//
// Aucune logique de verdict ici : gravités, anomalies et mesures viennent du
// backend. Deux écrans qui recalculent la même règle finissent par ne plus
// dire la même chose.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronRight, Network, Store, Users } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  ApiError,
  lireEcosysteme,
  type AgenceEco,
  type AgregatsEco,
  type BrancheEco,
  type CompanyEco,
  type KiosqueEco,
  type PaysEco,
  type VueEcosysteme,
} from '../lib/api'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; vue: VueEcosysteme }
  | { phase: 'vide'; message: string }
  | { phase: 'erreur'; message: string }

/** Les couleurs d'institution — la teinte porte QUI, jamais une décoration.
 *  Trois suffisent : deux IMF par pays, plus une réserve. */
const TEINTES = ['var(--primary)', 'var(--secondary)', 'var(--primary-dark)']

/** Le survol : ce qui n'entre pas dans la ligne. Jamais une répétition — le
 *  chemin complet et les IDENTIFIANTS RÉELS côté plateforme, pour qu'on
 *  puisse ouvrir un ticket sans retourner en base. */
type Survol = { x: number; y: number; titre: string; chemin: string; lignes: [string, string][]; alerte?: string } | null

const LARGEUR_SURVOL = 268
const HAUTEUR_SURVOL = 176

type Traduire = ReturnType<typeof useApp>['t']

function agregatsEnTexte(a: AgregatsEco, t: Traduire): string {
  const parts: string[] = []
  if (a.companies) parts.push(`${a.companies} IMF`)
  if (a.branches) parts.push(`${a.branches} ${t('eco_branches')}`)
  if (a.agences) parts.push(`${a.agences} ${t('eco_agences')}`)
  if (a.kiosques) parts.push(`${a.kiosques} ${t('eco_kiosques')}`)
  if (a.agents) parts.push(`${a.agents} ${t('eco_agents')}`)
  parts.push(`${a.clients} ${t('eco_clients')}`)
  return parts.join(' · ')
}

export function Ecosysteme() {
  const { t, setCurrentPage } = useApp()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [ouverts, setOuverts] = useState<Record<string, boolean>>({})
  const [filtre, setFiltre] = useState('')
  const [survol, setSurvol] = useState<Survol>(null)

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const vue = await lireEcosysteme()
      // `P-06` — `run_id === null` ne veut PLUS dire « rien » : c'est le
      // perimetre CUMULATIF, le cas le plus plein. Seule l'absence de pays
      // fait un ecran vide. Tester le run_id ici aurait masque tout
      // l'ecosysteme derriere un « aucun run en base ».
      if ((vue.pays ?? []).length === 0) {
        setEtat({ phase: 'vide', message: vue.note ?? t('eco_vide') })
      } else {
        setEtat({ phase: 'pret', vue })
      }
    } catch (err) {
      // 404 « aucun noeud pour le run » = un DRY sans arbre — vide honnête.
      if (err instanceof ApiError && err.status === 404) {
        setEtat({ phase: 'vide', message: String(err.detail) })
      } else {
        setEtat({ phase: 'erreur', message: messageDe(err) })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t])

  useEffect(() => {
    void charger()
  }, [charger])

  const basculer = (cle: string) => setOuverts((o) => ({ ...o, [cle]: !o[cle] }))

  // LE FILTRE TRAVERSE LES CINQ NIVEAUX et ne garde que les branches qui
  // portent encore quelque chose : un filtre qui laisse des branches vides
  // fait croire à un réseau plus large qu'il n'est.
  const paysFiltres = useMemo(() => {
    if (etat.phase !== 'pret') return []
    const tous = etat.vue.pays ?? []
    const bas = filtre.trim().toLowerCase()
    if (!bas) return tous
    const contient = (v: string | null | undefined) => (v ?? '').toLowerCase().includes(bas)
    return tous
      .map((pays) => ({
        ...pays,
        companies: pays.companies
          .map((imf) => ({
            ...imf,
            branches: imf.branches
              .map((br) => ({
                ...br,
                agences: br.agences
                  .map((ag) => ({
                    ...ag,
                    kiosques: ag.kiosques.filter(
                      (k) => contient(k.nom) || contient(k.quartier) || contient(ag.ville),
                    ),
                  }))
                  .filter((ag) => ag.kiosques.length > 0 || contient(ag.nom) || contient(ag.ville)),
              }))
              .filter((br) => br.agences.length > 0 || contient(br.nom) || contient(br.region)),
          }))
          .filter((imf) => imf.branches.length > 0 || contient(imf.nom)),
      }))
      .filter((pays) => pays.companies.length > 0 || contient(pays.nom) || contient(pays.iso2))
  }, [etat, filtre])

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={110} />
        <Skeleton height={300} />
      </div>
    )
  }

  if (etat.phase === 'erreur' || etat.phase === 'vide') {
    return (
      <div>
        <SectionHeader title={t('eco_titre')} subtitle={t('eco_sous_titre')} />
        <Banniere ton={etat.phase === 'erreur' ? 'danger' : 'info'}>
          {etat.message}
          {etat.phase === 'vide' && (
            <>
              {' — '}
              <button
                className="underline font-semibold"
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                onClick={() => setCurrentPage('runs-preparer')}
              >
                {t('eco_aller_preparer')}
              </button>
            </>
          )}
        </Banniere>
        {etat.phase === 'erreur' && (
          <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
            {t('retry')}
          </button>
        )}
      </div>
    )
  }

  const { vue } = etat
  const mesures = vue.mesures
  const tous = vue.pays ?? []
  // La charge se mesure sur les CLIENTS quand il y en a, sinon sur les
  // kiosques : avant le module CLIENTS, un treemap de zéros ne dirait rien.
  const totalClients = tous.reduce((s, p) => s + p.agregats.clients, 0)
  const cle: keyof AgregatsEco = totalClients > 0 ? 'clients' : 'kiosques'
  const totalCharge = tous.reduce((s, p) => s + p.agregats[cle], 0) || 1

  const survoler = (
    e: { clientX: number; clientY: number },
    titre: string,
    chemin: string,
    lignes: [string, string][],
    alerte?: string,
  ) => setSurvol({ x: e.clientX, y: e.clientY, titre, chemin, lignes, alerte })

  return (
    <div className="animate-fade-in" onMouseLeave={() => setSurvol(null)}>
      <SectionHeader title={t('eco_titre')} subtitle={t('eco_sous_titre')} />

      {/* ============ L'ARBRE EST-IL ENCORE VRAI ? ============
          `org_hierarchy` est NOTRE mémoire d'un run. La purge n'y touche pas,
          et la plateforme peut être vidée de son côté : l'arbre afficherait
          alors des kiosques dont le Dépositaire n'existe plus, sans le dire.
          Ce bandeau est la première chose qu'on lit, parce que tout ce qui
          suit en dépend. */}
      {vue.verification && vue.verification.kiosques_disparus > 0 && (
        <div className="mb-3">
          <Banniere ton="danger">{vue.verification.motif}</Banniere>
        </div>
      )}
      {vue.verification && !vue.verification.verifie && (
        <div className="mb-3">
          <Banniere ton="info">{t('eco_non_verifie')}</Banniere>
        </div>
      )}

      {/* ============ LES TROIS MESURES — « est-ce crédible ? » ============ */}
      {mesures && (
        <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(13rem,1fr))' }}>
          <Card style={{ padding: '10px 12px', borderLeft: `3px solid ${mesures.concentration.verdict === 'concentre' ? 'var(--warning)' : 'var(--success)'}` }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('eco_m_concentration')}
            </p>
            {/* UN NOMBRE NU NE JUGE RIEN : la part attendue d'un reseau
                parfaitement reparti est affichee JUSTE A COTE, et le Gini
                dit la forme de la distribution — huit IMF equivalentes et
                sept minuscules plus une enorme peuvent partager le meme
                maximum. */}
            <p className="text-2xl font-semibold tabular-nums">
              {mesures.concentration.part_max_pourcent} %
              <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                {' / '}
                {mesures.concentration.part_attendue_pourcent} % {t('eco_m_attendu')}
              </span>
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {mesures.concentration.imf ?? '—'} · {mesures.concentration.nb_imf} IMF ·{' '}
              {t('eco_m_gini')} {mesures.concentration.gini} ·{' '}
              {mesures.concentration.min_kiosques}–{mesures.concentration.max_kiosques}{' '}
              {t('eco_kiosques')} ·{' '}
              <b style={{ color: mesures.concentration.verdict === 'concentre' ? 'var(--warning)' : 'var(--success)' }}>
                {t(mesures.concentration.verdict === 'concentre' ? 'eco_m_concentre' : 'eco_m_reparti')}
              </b>
            </p>
          </Card>

          <Card style={{ padding: '10px 12px', borderLeft: '3px solid var(--primary)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('eco_m_couverture')}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {mesures.couverture.villes}
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                {' / '}
                {mesures.couverture.villes_du_referentiel}
              </span>
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {mesures.couverture.pays} {t('eco_pays')} · {mesures.couverture.regions} {t('geo_regions')} ·{' '}
              {mesures.couverture.quartiers} {t('geo_quartiers')}
            </p>
          </Card>

          <Card
            style={{
              padding: '10px 12px',
              borderLeft: `3px solid ${
                mesures.integrite.kiosques_sans_agent + mesures.integrite.agences_sans_kiosque > 0
                  ? 'var(--danger)'
                  : 'var(--success)'
              }`,
            }}
          >
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('eco_m_integrite')}
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {mesures.integrite.kiosques_sans_agent +
                mesures.integrite.agences_sans_kiosque +
                mesures.integrite.branches_sans_agence +
                (mesures.integrite.kiosques_disparus_la_bas ?? 0)}
            </p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              {mesures.integrite.kiosques_sans_agent} {t('eco_i_sans_agent')} ·{' '}
              {mesures.integrite.agences_sans_kiosque} {t('eco_i_agence_vide')} ·{' '}
              {mesures.integrite.branches_sans_agence} {t('eco_i_branche_vide')}
              {/* `null` = non mesuré. On l'écrit « ? », jamais 0 : un 0 serait
                  une affirmation qu'on n'a pas faite. */}
              {mesures.integrite.kiosques_disparus_la_bas !== undefined && (
                <>
                  {' · '}
                  {mesures.integrite.kiosques_disparus_la_bas ?? '?'} {t('eco_i_disparus')}
                </>
              )}
            </p>
          </Card>

          <Card style={{ padding: '10px 12px', borderLeft: '3px solid var(--secondary)' }}>
            <p className="text-[10px] font-mono uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              {t('eco_m_reste')}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{mesures.couverture.quartiers_libres}</p>
            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{t('eco_m_reste_dit')}</p>
          </Card>
        </div>
      )}

      {/* ============ LA CARTE DE CHARGE — « est-ce équilibré ? » ============ */}
      <Card className="mb-4" style={{ padding: '10px 12px' }}>
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
          <p className="text-xs font-semibold">{t('eco_charge_titre')}</p>
          <p className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
            {t(cle === 'clients' ? 'eco_charge_clients' : 'eco_charge_kiosques')}
          </p>
        </div>
        <div className="flex gap-1" style={{ height: 168 }}>
          {tous.map((pays) => {
            const partPays = pays.agregats[cle] || 0
            if (partPays === 0) return null
            return (
              <div
                key={pays.iso2}
                className="flex flex-col gap-1 min-w-0"
                style={{ flex: partPays }}
              >
                <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
                  {pays.nom.toUpperCase()} · {partPays}
                </p>
                <div className="flex gap-1 flex-1 min-h-0">
                  {pays.companies.map((imf, rang) => {
                    const part = imf.agregats[cle] || 0
                    if (part === 0) return null
                    // Le NOMBRE de kiosques en anomalie, pas un booleen :
                    // « 1 sur 6 » et « 6 sur 6 » ne se traitent pas pareil.
                    const enAnomalie = imf.branches.reduce(
                      (n, b) =>
                        n +
                        b.agences.reduce(
                          (m, a) => m + a.kiosques.filter((k) => k.anomalies.length > 0).length,
                          0,
                        ),
                      0,
                    )
                    return (
                      <button
                        key={imf.id}
                        type="button"
                        className="min-w-0 text-left rounded-sm px-1.5 py-1 flex flex-col justify-end overflow-hidden"
                        style={{
                          flex: part,
                          // LA COULEUR PORTE L'INSTITUTION, jamais l'anomalie.
                          // Repeindre la tuile entiere en rouge des qu'UN
                          // kiosque a un defaut noyait la carte (6 tuiles sur
                          // 8 rouges pour 4 kiosques sur 54) et detruisait
                          // l'encodage principal — la carte ne repondait plus
                          // a « est-ce equilibre ? », sa raison d'etre.
                          // Un canal par variable : teinte = qui, bandeau = defaut.
                          background: TEINTES[rang % TEINTES.length],
                          color: '#fff',
                          border: 'none',
                          borderTop: enAnomalie ? '4px solid var(--danger)' : undefined,
                          cursor: 'pointer',
                        }}
                        title={t('eco_charge_clic')}
                        onClick={() => {
                          // Un clic sur la tuile DÉPLIE la branche
                          // correspondante dans l'arbre — sans ce lien, les
                          // deux objets se regardent sans se parler.
                          setOuverts((o) => ({ ...o, [pays.iso2]: true, [imf.id]: true }))
                          document.getElementById(`imf-${imf.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
                        }}
                        onMouseMove={(e) =>
                          survoler(
                            e,
                            imf.nom ?? t('eco_imf_sans_nom'),
                            `${pays.nom}`,
                            [
                              [t('eco_kiosques'), String(imf.agregats.kiosques)],
                              [t('eco_agents'), String(imf.agregats.agents)],
                              [t('eco_clients'), String(imf.agregats.clients)],
                              [t('eco_part_reseau'), `${Math.round((100 * part) / totalCharge)} %`],
                              ['company_id', imf.id.slice(0, 8) + '…'],
                            ],
                            enAnomalie
                              ? `${enAnomalie} ${t('eco_i_sans_agent')}`
                              : undefined,
                          )
                        }
                      >
                        <span className="text-[11px] font-semibold truncate block">
                          {imf.nom ?? t('eco_imf_sans_nom')}
                        </span>
                        <span className="text-[10px] font-mono opacity-90">
                          {imf.agregats.kiosques} {t('eco_kiosques')}
                          {enAnomalie > 0 && (
                            <span
                              className="ml-1 px-1 rounded"
                              style={{ background: 'var(--danger)', color: '#fff' }}
                            >
                              ▲ {enAnomalie}
                            </span>
                          )}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
          <span>
            <span className="inline-block w-2.5 h-2.5 rounded-sm mr-1 align-[-1px]" style={{ background: 'var(--danger)' }} />
            {t('eco_legende_anomalie')}
          </span>
          <span>{t('eco_legende_surface')}</span>
        </div>
      </Card>

      {/* ============ L'ARBRE — « qui est là ? » ============ */}
      <div className="flex flex-wrap gap-2 mb-2 items-center">
        {Object.entries(vue.comptes ?? {}).map(([niveau, compte]) => (
          <span key={niveau} className="badge-primary font-mono text-[10px]">
            {compte} {niveau}
          </span>
        ))}
        <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
          {vue.libelle ?? (vue.run_id ? `run ${vue.run_id.slice(0, 8)}` : '')}
        </span>
      </div>

      <input
        className="input-base mb-3"
        style={{ maxWidth: 420 }}
        placeholder={t('eco_recherche')}
        value={filtre}
        onChange={(e) => setFiltre(e.target.value)}
      />

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {paysFiltres.length === 0 && (
          <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
            {t('flt_vide')}
          </p>
        )}

        {paysFiltres.map((pays: PaysEco) => {
          const ouvertPays = ouverts[pays.iso2] ?? false
          return (
            <div key={pays.iso2}>
              <Ligne
                niveau={1}
                ouvert={ouvertPays}
                pliable
                onClick={() => basculer(pays.iso2)}
                icone={<Network size={13} />}
                titre={pays.nom}
                agregats={agregatsEnTexte(pays.agregats, t)}
                onSurvol={(e) =>
                  survoler(e, pays.nom, t('eco_pays'), [
                    ['ISO2', pays.iso2],
                    [t('eco_m_reste'), String(pays.quartiers_libres.compte)],
                    [t('eco_kiosques'), String(pays.agregats.kiosques)],
                    [t('eco_clients'), String(pays.agregats.clients)],
                  ])
                }
              />

              {ouvertPays &&
                pays.companies.map((imf: CompanyEco, rang) => {
                  const ouvertImf = ouverts[imf.id] ?? false
                  return (
                    <div key={imf.id} id={`imf-${imf.id}`}>
                      <Ligne
                        niveau={2}
                        ouvert={ouvertImf}
                        pliable
                        onClick={() => basculer(imf.id)}
                        pastille={TEINTES[rang % TEINTES.length]}
                        titre={imf.nom ?? t('eco_imf_sans_nom')}
                        avertissement={imf.nom_inconnu ? t('eco_imf_sans_nom_dit') : undefined}
                        agregats={agregatsEnTexte(imf.agregats, t)}
                        onSurvol={(e) =>
                          survoler(
                            e,
                            imf.nom ?? t('eco_imf_sans_nom'),
                            pays.nom,
                            [
                              ['company_id', imf.id],
                              [t('eco_branches'), String(imf.agregats.branches)],
                              [t('eco_kiosques'), String(imf.agregats.kiosques)],
                              [t('eco_clients'), String(imf.agregats.clients)],
                            ],
                            imf.nom_inconnu ? t('eco_imf_sans_nom_dit') : undefined,
                          )
                        }
                      />

                      {ouvertImf &&
                        imf.branches.map((br: BrancheEco) => {
                          const ouvertBr = ouverts[br.id] ?? false
                          return (
                            <div key={br.id}>
                              <Ligne
                                niveau={3}
                                ouvert={ouvertBr}
                                pliable
                                onClick={() => basculer(br.id)}
                                titre={br.nom}
                                suffixe={br.region ?? undefined}
                                agregats={agregatsEnTexte(br.agregats, t)}
                                alerte={br.anomalies[0]}
                                onSurvol={(e) =>
                                  survoler(
                                    e,
                                    br.nom,
                                    `${pays.nom} › ${imf.nom ?? '—'}`,
                                    [
                                      [t('geo_regions'), br.region ?? '—'],
                                      ['region_id', br.region_id ?? '—'],
                                      [t('eco_agences'), String(br.agregats.agences)],
                                      [t('eco_kiosques'), String(br.agregats.kiosques)],
                                    ],
                                    br.anomalies[0],
                                  )
                                }
                              />

                              {ouvertBr &&
                                br.agences.map((ag: AgenceEco) => {
                                  const ouvertAg = ouverts[ag.id] ?? true
                                  return (
                                    <div key={ag.id}>
                                      <Ligne
                                        niveau={4}
                                        ouvert={ouvertAg}
                                        pliable
                                        onClick={() => basculer(ag.id)}
                                        titre={ag.nom}
                                        suffixe={ag.ville ?? undefined}
                                        agregats={agregatsEnTexte(ag.agregats, t)}
                                        alerte={ag.anomalies[0]}
                                        onSurvol={(e) =>
                                          survoler(
                                            e,
                                            ag.nom,
                                            `${pays.nom} › ${imf.nom ?? '—'} › ${br.nom}`,
                                            [
                                              [t('geo_villes'), ag.ville ?? '—'],
                                              ['city_id', ag.ville_id ?? '—'],
                                              [t('eco_kiosques'), String(ag.agregats.kiosques)],
                                              [t('eco_clients'), String(ag.agregats.clients)],
                                            ],
                                            ag.anomalies[0],
                                          )
                                        }
                                      />

                                      {ouvertAg &&
                                        ag.kiosques.map((k: KiosqueEco) => (
                                          <Ligne
                                            key={k.id}
                                            niveau={5}
                                            icone={<Store size={12} />}
                                            titre={k.nom}
                                            suffixe={k.quartier ?? undefined}
                                            alerte={k.anomalies[0]}
                                            agregats={`${k.nb_agents} ${t('eco_agents')} · ${k.nb_clients} ${t('eco_clients')}`}
                                            action={
                                              k.nb_clients > 0 ? (
                                                <button
                                                  type="button"
                                                  className="btn-ghost text-[10px] px-1.5 py-0.5"
                                                  onClick={() => setCurrentPage('population')}
                                                  title={t('eco_voir_clients')}
                                                >
                                                  <Users size={10} className="inline mr-0.5" />
                                                  {k.nb_clients}
                                                </button>
                                              ) : undefined
                                            }
                                            onSurvol={(e) =>
                                              survoler(
                                                e,
                                                k.nom,
                                                `${pays.nom} › ${imf.nom ?? '—'} › ${br.nom} › ${ag.nom}`,
                                                [
                                                  [t('geo_quartiers'), k.quartier ?? '—'],
                                                  ['district_id', k.quartier_id ?? '—'],
                                                  [
                                                    'depositary_id',
                                                    k.depositary_id ? k.depositary_id.slice(0, 8) + '…' : '—',
                                                  ],
                                                  [t('eco_agents'), String(k.nb_agents)],
                                                  [t('eco_clients'), String(k.nb_clients)],
                                                ],
                                                k.anomalies[0],
                                              )
                                            }
                                          />
                                        ))}
                                    </div>
                                  )
                                })}
                            </div>
                          )
                        })}
                    </div>
                  )
                })}

              {/* CE QUI MANQUE — la couverture inverse. `D-03` : un quartier
                  = UN kiosque, donc les quartiers non pris SONT les
                  emplacements disponibles. Sans cette liste, ouvrir le
                  formulaire de création revenait à deviner un quartier libre
                  parmi plusieurs centaines, puis à se faire refuser. */}
              {ouvertPays && pays.quartiers_libres.compte > 0 && (
                <div
                  className="px-4 py-2 text-[11px]"
                  style={{ background: 'var(--surface-hover, rgba(0,0,0,.03))', borderBottom: '1px solid var(--border)' }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    <b>{pays.quartiers_libres.compte}</b> {t('eco_libres')} —{' '}
                  </span>
                  {pays.quartiers_libres.exemples.slice(0, 6).map((q) => (
                    <span key={q.district_id} className="font-mono" style={{ color: 'var(--text-muted)' }}>
                      {q.ville}/{q.quartier}{' '}
                    </span>
                  ))}
                  <button
                    type="button"
                    className="btn-ghost text-[10px] px-1.5 py-0.5 ml-1"
                    onClick={() => setCurrentPage('entites-depositaire')}
                  >
                    {t('eco_creer_ici')}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </Card>

      <p className="text-[10px] mt-2" style={{ color: 'var(--text-muted)' }}>
        {vue.note}
      </p>

      {/* LE SURVOL — il BASCULE du côté où il y a la place, il ne s'épingle
          jamais au bord : le curseur continuerait et le lien entre la ligne
          survolée et l'information affichée se casserait. */}
      {survol && (
        <div
          className="fixed z-50 rounded-lg border px-3 py-2 shadow-lg pointer-events-none"
          style={{
            left:
              survol.x + 12 + LARGEUR_SURVOL > window.innerWidth
                ? survol.x - 12 - LARGEUR_SURVOL
                : survol.x + 12,
            top:
              survol.y + 12 + HAUTEUR_SURVOL > window.innerHeight
                ? Math.max(6, survol.y - 12 - HAUTEUR_SURVOL)
                : survol.y + 12,
            width: LARGEUR_SURVOL,
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          <p className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
            {survol.chemin}
          </p>
          <p className="text-xs font-semibold mb-1">{survol.titre}</p>
          <table className="w-full text-[11px]">
            <tbody>
              {survol.lignes.map(([cle_, valeur]) => (
                <tr key={cle_}>
                  <td style={{ color: 'var(--text-secondary)' }}>{cle_}</td>
                  <td className="text-right font-mono tabular-nums truncate" style={{ maxWidth: 130 }}>
                    {valeur}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {survol.alerte && (
            <p
              className="text-[10px] mt-1.5 px-1.5 py-1 rounded"
              style={{ background: 'var(--danger-soft, rgba(200,40,30,.12))', color: 'var(--danger)' }}
            >
              {survol.alerte}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

/** UNE ligne de l'arbre — même gabarit aux cinq niveaux : le titre à gauche,
 *  les agrégats à droite. Un niveau qui inventerait sa propre mise en page
 *  casserait la lecture verticale. */
function Ligne({
  niveau,
  titre,
  suffixe,
  agregats,
  ouvert,
  pliable,
  onClick,
  icone,
  pastille,
  alerte,
  avertissement,
  action,
  onSurvol,
}: {
  niveau: 1 | 2 | 3 | 4 | 5
  titre: string
  suffixe?: string
  agregats: string
  ouvert?: boolean
  pliable?: boolean
  onClick?: () => void
  icone?: React.ReactNode
  pastille?: string
  alerte?: string
  avertissement?: string
  action?: React.ReactNode
  onSurvol?: (e: React.MouseEvent) => void
}) {
  const retraits = { 1: 12, 2: 28, 3: 46, 4: 64, 5: 82 }
  return (
    <div
      className="flex items-baseline justify-between gap-3 py-1 pr-3"
      style={{
        paddingLeft: retraits[niveau],
        borderBottom: '1px solid var(--border)',
        background: niveau === 1 ? 'var(--surface-hover, rgba(0,0,0,.03))' : undefined,
        cursor: pliable ? 'pointer' : 'default',
      }}
      onClick={onClick}
      onMouseMove={onSurvol}
    >
      <span className="flex items-baseline gap-1.5 min-w-0">
        {pliable &&
          (ouvert ? (
            <ChevronDown size={12} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
          ) : (
            <ChevronRight size={12} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
          ))}
        {pastille && (
          <span
            className="inline-block w-2 h-2 rounded-sm"
            style={{ background: pastille, flex: '0 0 auto' }}
            aria-hidden="true"
          />
        )}
        {icone}
        <span
          className={niveau <= 2 ? 'text-xs font-semibold truncate' : 'text-xs truncate'}
          style={{ color: niveau === 5 ? 'var(--text-secondary)' : undefined }}
        >
          {titre}
        </span>
        {suffixe && (
          <span className="text-[10px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
            {suffixe}
          </span>
        )}
        {alerte && (
          <span
            className="text-[9px] font-mono px-1 rounded whitespace-nowrap"
            style={{ background: 'var(--danger-soft, rgba(200,40,30,.12))', color: 'var(--danger)' }}
          >
            ▲
          </span>
        )}
        {avertissement && (
          <span
            className="text-[9px] font-mono px-1 rounded whitespace-nowrap"
            style={{ background: 'var(--warning-soft, rgba(180,120,0,.14))', color: 'var(--warning)' }}
          >
            ?
          </span>
        )}
      </span>
      <span className="flex items-baseline gap-2 flex-none">
        <span className="text-[10px] font-mono tabular-nums whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
          {agregats}
        </span>
        {action}
      </span>
    </div>
  )
}
