// src/components/ReglageDuree.tsx
//
// LE RÉGLAGE DE LA DURÉE DU BAIL — contrat 0.4 §(b), la face écran du
// serveur livré le 27/08. Un bouton dans Baux actifs qui AFFICHE la durée
// en vigueur, et une modale pour la régler : globale + surcharges par pays,
// bornée par ce que le SERVEUR annonce (jamais un 1-30 écrit en dur ici).
//
// Écriture réservée au super_admin — même niveau que la reprise : changer
// la politique des baux n'est pas un geste ordinaire. La lecture est pour
// tous les rôles admis sur l'écran. Après l'enregistrement, le toast
// CHIFFRE ce que le geste n'a pas touché (« N baux actifs inchangés ») —
// la promesse datée, vérifiable à l'écran.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Timer } from 'lucide-react'
import { lireReglagesBail, reglerDureeBail, type ReglagesBail } from '../lib/api'
import { Modale } from './ui/Modale'
import { useToast } from './ui/loader'
import { useApp } from '../context/AppContext'

export function ReglageDuree({
  paysDisponibles,
  estSuperAdmin,
  surEnregistre,
}: {
  /** Les pays du pool — la surcharge ne vise que des pays qui existent. */
  paysDisponibles: string[]
  estSuperAdmin: boolean
  surEnregistre: () => void
}) {
  const { t } = useApp()
  const { pousser } = useToast()
  const [reglages, setReglages] = useState<ReglagesBail | null>(null)
  const [ouvert, setOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [globale, setGlobale] = useState('7')
  const [surcharges, setSurcharges] = useState<Record<string, string>>({})
  const [erreur, setErreur] = useState<string | null>(null)

  const charger = useCallback(async () => {
    try {
      const corps = await lireReglagesBail()
      setReglages(corps)
      setGlobale(String(corps.reglages.jours_defaut))
      setSurcharges(
        Object.fromEntries(
          Object.entries(corps.reglages.par_pays).map(([pays, jours]) => [pays, String(jours)]),
        ),
      )
    } catch {
      setReglages(null)
    }
  }, [])
  useEffect(() => {
    void charger()
  }, [charger])

  const bornes = reglages?.bornes ?? { min: 1, max: 30 }
  const paysSansSurcharge = useMemo(
    () => paysDisponibles.filter((pays) => !(pays in surcharges)),
    [paysDisponibles, surcharges],
  )

  const enregistrer = async () => {
    setErreur(null)
    const joursDefaut = Number.parseInt(globale, 10)
    const parPays: Record<string, number> = {}
    for (const [pays, brut] of Object.entries(surcharges)) {
      const jours = Number.parseInt(brut, 10)
      if (Number.isFinite(jours)) parPays[pays] = jours
    }
    setEnvoi(true)
    try {
      const corps = await reglerDureeBail(joursDefaut, parPays)
      pousser(
        'succes',
        t('dur_enregistre').replace('{n}', String(corps.baux_existants.actifs_inchanges)),
      )
      setOuvert(false)
      await charger()
      surEnregistre()
    } catch (err) {
      // AFF-05 : le refus du serveur (bornes, pays inconnu) se dit tel quel —
      // il est déjà rédigé pour un humain, jamais un code.
      const detail = (err as { detail?: unknown })?.detail
      setErreur(typeof detail === 'string' ? detail : t('attr_erreur_chargement'))
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <>
      <button
        className="btn-ghost"
        disabled={!estSuperAdmin}
        title={estSuperAdmin ? undefined : t('dur_super_admin')}
        onClick={() => setOuvert(true)}
      >
        <Timer size={14} /> {t('dur_bouton')}
        {reglages && (
          <span className="badge-primary">
            {reglages.reglages.jours_defaut} j
            {Object.keys(reglages.reglages.par_pays).length > 0
              ? ` +${Object.keys(reglages.reglages.par_pays).length}`
              : ''}
          </span>
        )}
      </button>

      {ouvert && (
        <Modale titre={t('dur_titre')} onClose={() => setOuvert(false)}>
          <p style={{ fontSize: 'var(--fs-corps)', color: 'var(--text-secondary)', marginBottom: 14 }}>
            {t('dur_doctrine')}
          </p>

          <label style={{ display: 'block', marginBottom: 14 }}>
            <span style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)' }}>
              {t('dur_globale')} ({bornes.min}–{bornes.max})
            </span>
            <input
              className="input-base"
              style={{ marginTop: 4, maxWidth: 120 }}
              type="number"
              min={bornes.min}
              max={bornes.max}
              value={globale}
              onChange={(e) => setGlobale(e.target.value)}
            />
          </label>

          <p style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)', marginBottom: 6 }}>
            {t('dur_surcharges')}
          </p>
          {Object.keys(surcharges).length === 0 && (
            <p style={{ fontSize: 'var(--fs-corps)', color: 'var(--text-muted)', marginBottom: 8 }}>
              {t('dur_surcharge_aucune')}
            </p>
          )}
          <div style={{ display: 'grid', gap: 8, marginBottom: 12 }}>
            {Object.entries(surcharges).map(([pays, jours]) => (
              <div key={pays} className="flex items-center gap-2">
                <span className="font-mono font-bold" style={{ width: 32 }}>{pays}</span>
                <input
                  className="input-base"
                  style={{ maxWidth: 100 }}
                  type="number"
                  min={bornes.min}
                  max={bornes.max}
                  value={jours}
                  onChange={(e) =>
                    setSurcharges((avant) => ({ ...avant, [pays]: e.target.value }))
                  }
                />
                <span style={{ fontSize: 'var(--fs-note)', color: 'var(--text-secondary)' }}>
                  {t('dur_jours')}
                </span>
                <button
                  className="btn-ghost"
                  style={{ padding: '4px 10px', fontSize: 'var(--fs-note)' }}
                  onClick={() =>
                    setSurcharges((avant) => {
                      const { [pays]: _retire, ...reste } = avant
                      return reste
                    })
                  }
                >
                  {t('dur_suivre_globale')}
                </button>
              </div>
            ))}
          </div>
          {paysSansSurcharge.length > 0 && (
            <select
              className="input-base"
              style={{ maxWidth: 260, marginBottom: 14 }}
              value=""
              onChange={(e) => {
                const pays = e.target.value
                if (pays) setSurcharges((avant) => ({ ...avant, [pays]: globale }))
              }}
              aria-label={t('dur_ajouter_surcharge')}
            >
              <option value="">{t('dur_ajouter_surcharge')}…</option>
              {paysSansSurcharge.map((pays) => (
                <option key={pays} value={pays}>{pays}</option>
              ))}
            </select>
          )}

          {erreur && (
            <p style={{ fontSize: 'var(--fs-corps)', color: 'var(--danger)', marginBottom: 10 }} role="alert">
              {erreur}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setOuvert(false)}>{t('annuler')}</button>
            <button className="btn-primary" disabled={envoi} onClick={() => void enregistrer()}>
              {t('dur_enregistrer')}
            </button>
          </div>
        </Modale>
      )}
    </>
  )
}
