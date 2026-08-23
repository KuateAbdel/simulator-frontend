// src/pages/RefPaysMonnaies.tsx — LE PANNEAU DE CHARGEMENT de config-service.
//
// Refonte 22/08 (conception Yaniv) : plus AUCUNE creation manuelle — les pays
// et devises entrent au Loader par l'IMPORT BACKEND. Cet ecran maitrise la
// MACHINE D'ETATS d'un pays, verifiee EN DIRECT a chaque chargement :
//
//   EN OPERATION      chez nous ET la-bas          -> badge vert (clignote)
//   PRET A POUSSER    chez nous + geographie       -> bouton « Pousser »
//   FICHE SEULE       chez nous, sans geographie   -> completer par import
//   LA-BAS SEULEMENT  sur config-service, inconnu  -> ANOMALIE montree
//
// « Pousser » part de NOTRE fiche (rien n'est ressaisi) : devise creee
// la-bas si absente, villes du referentiel envoyees. La reponse du backend
// s'affiche mot pour mot — succes, « deja en operation », ou 502 COMPLET.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { RefreshCw, Send } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { BarreFiltre, useFiltreListe } from '../components/FiltreListe'
import { usePagination } from '../hooks/usePagination'
import { Pager } from '../components/Pager'
import { Banniere, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import {
  desactiverDeviseConfig,
  lireDevisesConfig,
  lireFichesPays,
  pousserPays,
  type DeviseConfig,
  type FichePays,
} from '../lib/api'
import { fautesDe } from './entites-commun'
import { useMessageDe } from './runs-commun'

type EtatPays = 'operation' | 'pret' | 'fiche'

function etatDe(fiche: FichePays): EtatPays {
  if (fiche.sur_config_service) return 'operation'
  // `V-02` (23/08) — « prêt » N'EST PLUS DEVINÉ ICI. L'écran regardait
  // `completude.regions > 0`, ce qui n'a jamais été la règle de la porte : un
  // pays avec des régions mais sans opérateur affichait un bouton « Pousser »
  // qui répondait 422. La règle vit dans le backend, l'écran la lit.
  if (fiche.poussable) return 'pret'
  return 'fiche'
}

const COULEURS: Record<EtatPays, string> = {
  operation: '#15803D',
  pret: '#B45309',
  fiche: '#64748B',
}

export function RefPaysMonnaies() {
  const { t } = useApp()
  const { pousser: toast } = useToast()
  const messageDe = useMessageDe()

  const [fiches, setFiches] = useState<FichePays[] | null>(null)
  const [horsLoader, setHorsLoader] = useState<string[] | null>(null)
  const [erreur, setErreur] = useState<string | null>(null)
  const [chargement, setChargement] = useState(true)
  const [envoiIso, setEnvoiIso] = useState<string | null>(null)
  const [resultats, setResultats] = useState<Record<string, string>>({})

  const [devisesConfig, setDevisesConfig] = useState<DeviseConfig[] | null>(null)
  const [devisesNote, setDevisesNote] = useState('')
  const [refus, setRefus] = useState<Record<string, string>>({})

  const charger = useCallback(async () => {
    setChargement(true)
    setErreur(null)
    try {
      const [reponse, devises] = await Promise.all([
        lireFichesPays(),
        lireDevisesConfig().catch(() => null),
      ])
      setFiches(reponse.pays)
      setHorsLoader(reponse.hors_loader)
      if (devises) {
        setDevisesConfig(devises.devises)
        setDevisesNote(devises.note)
      }
    } catch (err) {
      setErreur(messageDe(err))
    } finally {
      setChargement(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // ORDRE ALPHABETIQUE (demande administration, 23/08) — par NOM, pas par code
  // ISO : personne ne cherche « ZA », tout le monde cherche « Afrique du Sud ».
  // `localeCompare` classe les accents comme le fait un annuaire francais.
  const fichesTriees = useMemo(
    () => [...(fiches ?? [])].sort((a, b) => a.nom_fr.localeCompare(b.nom_fr, 'fr')),
    [fiches],
  )
  const fPays = useFiltreListe(
    fichesTriees,
    (f) => [f.nom_fr, f.nom_en, f.iso2, f.devise_iso, f.capitale],
    (f) => f.nom_fr,
  )
  // `cle` en resetKey : un filtre qui change ramene a la page 1, sinon on
  // reste sur une page 7 qui n'existe plus dans le resultat filtre.
  const pgPays = usePagination(fPays.resultat, 25, fPays.cle)

  const comptes = useMemo(() => {
    const compte = { operation: 0, pret: 0, fiche: 0 }
    for (const fiche of fiches ?? []) compte[etatDe(fiche)] += 1
    return compte
  }, [fiches])

  const mettreEnOperation = async (fiche: FichePays) => {
    if (envoiIso) return
    setEnvoiIso(fiche.iso2)
    try {
      const reponse = await pousserPays(fiche.iso2)
      const message =
        reponse.statut === 'deja_en_operation'
          ? t('pm_deja_operation')
          : `${t('pm_pousse_ok')} — ${t('pm_devise')} ${reponse.devise.code} (${reponse.devise.statut}), ${reponse.villes_envoyees} ${t('geo_villes')}`
      setResultats((avant) => ({ ...avant, [fiche.iso2]: message }))
      toast('succes', `${fiche.nom_fr} : ${message}`)
      await charger()
    } catch (err) {
      const motif = fautesDe(err).join(' ')
      setResultats((avant) => ({ ...avant, [fiche.iso2]: motif }))
      toast('erreur', motif)
    } finally {
      setEnvoiIso(null)
    }
  }

  if (chargement && fiches === null) {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={280} />
        <Skeleton height={300} />
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('pm_titre')}
        subtitle={t('pm_sous_titre_v2')}
        action={
          <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={() => void charger()}>
            <RefreshCw size={12} /> {t('run_actualiser')}
          </button>
        }
      />

      {erreur && <Banniere ton="danger">{erreur}</Banniere>}

      {fiches && (
        <>
          {/* Tuiles — la machine d'etats, chiffree en direct */}
          <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
            {[
              { valeur: fiches.length, libelle: t('globe_tuile_pays') },
              { valeur: comptes.operation, libelle: t('pm_etat_operation'), couleur: COULEURS.operation },
              { valeur: comptes.pret, libelle: t('pm_etat_pret'), couleur: COULEURS.pret },
              { valeur: comptes.fiche, libelle: t('globe_fiche'), couleur: COULEURS.fiche },
              { valeur: horsLoader === null ? '—' : horsLoader.length, libelle: t('pm_hors_loader') },
            ].map((tuile) => (
              <Card key={tuile.libelle} style={{ padding: '10px 12px 8px' }}>
                <div className="text-xl font-bold tabular-nums" style={{ color: tuile.couleur ?? 'var(--text-primary)' }}>
                  {tuile.valeur}
                </div>
                <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{tuile.libelle}</div>
              </Card>
            ))}
          </div>

          {/* ANOMALIES : la-bas mais inconnus du Loader — montrees, jamais cachees */}
          {horsLoader && horsLoader.length > 0 && (
            <Banniere ton="info">
              <strong>{t('pm_hors_loader')}</strong> : {horsLoader.join(' · ')} — {t('pm_hors_loader_note')}
            </Banniere>
          )}

          {/* LA TABLE DES FICHES + l'action Pousser */}
          <Card className="mb-4" style={{ padding: '8px 12px' }}>
            <BarreFiltre
              filtre={fPays}
              items={fichesTriees}
              initiale={(f) => f.nom_fr}
              placeholder={t('flt_pays')}
            />
            <div className="overflow-x-auto">
              <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ color: 'var(--text-secondary)' }}>
                    {[t('globe_col_pays'), t('globe_col_etat'), t('globe_col_devise'),
                      t('globe_col_tva'), t('geo_regions'), t('geo_villes'),
                      t('geo_quartiers'), ''].map((entete, i) => (
                      <th key={i} className="text-left px-2 py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                        {entete}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pgPays.pageItems.map((fiche) => {
                    const etat = etatDe(fiche)
                    return (
                      <tr key={fiche.iso2} style={{ color: 'var(--text-primary)' }}>
                        <td className="px-2 py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                          {fiche.nom_fr} <span className="font-mono">({fiche.iso2})</span>
                        </td>
                        <td className="px-2 py-1.5 border-b font-semibold" style={{ borderColor: 'var(--border)', color: COULEURS[etat] }}>
                          {etat === 'operation' ? t('pm_etat_operation')
                            : etat === 'pret' ? t('pm_etat_pret') : t('globe_fiche')}
                        </td>
                        <td className="px-2 py-1.5 border-b font-mono" style={{ borderColor: 'var(--border)' }}>{fiche.devise_iso}</td>
                        <td className="px-2 py-1.5 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.tva_percent}</td>
                        <td className="px-2 py-1.5 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.regions}</td>
                        <td className="px-2 py-1.5 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.villes}</td>
                        <td className="px-2 py-1.5 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.quartiers}</td>
                        <td className="px-2 py-1.5 border-b text-right" style={{ borderColor: 'var(--border)' }}>
                          {fiche.poussable && !fiche.sur_config_service && (
                            <button
                              className="btn-primary text-[10px]"
                              style={{ height: 24, opacity: envoiIso ? 0.6 : 1 }}
                              disabled={envoiIso !== null}
                              onClick={() => void mettreEnOperation(fiche)}
                            >
                              <Send size={10} /> {envoiIso === fiche.iso2 ? t('loading') : t('pm_pousser')}
                            </button>
                          )}
                          {/* L'absence du bouton s'EXPLIQUE. Un bouton qui
                              manque sans raison est aussi frustrant qu'un
                              bouton qui echoue. */}
                          {!fiche.poussable && !fiche.sur_config_service && (
                            <span
                              className="text-[9px]"
                              style={{ color: 'var(--text-muted)' }}
                              title={fiche.manques.join(' · ')}
                            >
                              {fiche.manques.join(' · ')}
                            </span>
                          )}
                          {resultats[fiche.iso2] && (
                            <p className="text-[9px] mt-0.5 text-left" style={{ color: 'var(--text-muted)' }} role="status">
                              {resultats[fiche.iso2]}
                            </p>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {fPays.resultat.length === 0 && (
              <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
                {t('flt_vide')}
              </p>
            )}
            <Pager
              page={pgPays.page}
              nbPages={pgPays.nbPages}
              size={pgPays.size}
              total={pgPays.total}
              from={pgPays.from}
              to={pgPays.to}
              onPage={pgPays.setPage}
              onSize={pgPays.setSize}
            />
          </Card>
        </>
      )}

      {/* LES DEVISES LA-BAS — lecture + test de garde (conserves) */}
      {devisesConfig && (
        <Card>
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            {t('pm_devises_labas')}
          </p>
          <p className="text-[10px] mb-2" style={{ color: 'var(--text-muted)' }}>{devisesNote}</p>
          <div className="space-y-1.5">
            {devisesConfig.map((devise) => (
              <div key={devise.id}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {devise.iso}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{devise.nom}</span>
                  <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                    {t('tel_porteurs')} : {devise.porteurs.join(' · ') || '—'}
                  </span>
                  <button
                    className="btn-ghost text-[10px] ml-auto"
                    style={{ height: 22 }}
                    onClick={() =>
                      void desactiverDeviseConfig(devise.id, 'constat depuis le Loader')
                        .then(() => setRefus((avant) => ({ ...avant, [devise.id]: 'ACCEPTÉE ?! — mesure du 09/08 périmée, à ré-auditer' })))
                        .catch((err: unknown) => setRefus((avant) => ({ ...avant, [devise.id]: fautesDe(err).join(' ') })))
                    }
                  >
                    {t('pm_devise_tester')}
                  </button>
                </div>
                {refus[devise.id] && (
                  <p className="text-[10px] mt-0.5" style={{ color: '#92400e' }} role="status">
                    {refus[devise.id]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
