// src/pages/RefTelcos.tsx — US-B7, les opérateurs. PHASE 4.
//
// Les 4 invariants du backend sont DOUBLÉS en direct dans le formulaire
// (regex compilable ET ancrée ^…$, exemple MSISDN conforme = la preuve,
// somme des parts du pays ≤ 100 = INV-18) : le bouton reste bloqué tant
// qu'un invariant casse — mais le 422 nommé du backend reste l'autorité.

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Radio } from 'lucide-react'
import { Card, SectionHeader } from '../components/ui'
import { Banniere, Skeleton, useToast } from '../components/ui/loader'
import { useApp } from '../context/AppContext'
import { usePagination } from '../hooks/usePagination'
import { BarreFiltre, useFiltreListe } from '../components/FiltreListe'
import { Pager } from '../components/Pager'
import {
  ajouterTelco,
  changerEtatTelco,
  lireTelcos,
  lireTelcosConfig,
  type Telco,
  type TelcoConfig,
} from '../lib/api'
import { ConfirmDialog } from '../components/ui/loader'
import { ChampLabel, fautesDe } from './entites-commun'
import { useMessageDe } from './runs-commun'

type Etat =
  | { phase: 'chargement' }
  | { phase: 'pret'; telcos: Record<string, Telco[]> }
  | { phase: 'erreur'; message: string }

export function RefTelcos() {
  const { t } = useApp()
  const { pousser } = useToast()
  const messageDe = useMessageDe()
  const [etat, setEtat] = useState<Etat>({ phase: 'chargement' })
  const [formulaireOuvert, setFormulaireOuvert] = useState(false)
  const [envoi, setEnvoi] = useState(false)
  const [erreurEnvoi, setErreurEnvoi] = useState<string | null>(null)
  const [fPays, setFPays] = useState('')
  const [fNom, setFNom] = useState('')
  const [fCode, setFCode] = useState('')
  const [fRegex, setFRegex] = useState('')
  const [fPart, setFPart] = useState('')
  const [fExemple, setFExemple] = useState('')
  // LA-BAS (16/08) : les operateurs TELS QUE config-service les porte —
  // etat reel + porteurs (la matiere de la garde des references inverses).
  const [configTelcos, setConfigTelcos] = useState<TelcoConfig[] | null>(null)
  const [configNote, setConfigNote] = useState('')
  const [configErreur, setConfigErreur] = useState<string | null>(null)
  const [cibleEtat, setCibleEtat] = useState<TelcoConfig | null>(null)
  const [fMotifEtat, setFMotifEtat] = useState('')
  const [etatErreur, setEtatErreur] = useState<string | null>(null)

  const chargerConfig = useCallback(async () => {
    setConfigErreur(null)
    try {
      const reponse = await lireTelcosConfig()
      setConfigTelcos(reponse.telcos)
      setConfigNote(reponse.note)
    } catch (err) {
      setConfigErreur(messageDe(err))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void chargerConfig()
  }, [chargerConfig])

  const basculerEtat = async () => {
    if (!cibleEtat || envoi) return
    if (fMotifEtat.trim().length < 3) {
      setEtatErreur(t('cpt_motif_note'))
      return
    }
    setEnvoi(true)
    setEtatErreur(null)
    try {
      const reponse = await changerEtatTelco(
        cibleEtat.id,
        !(cibleEtat.actif ?? true),
        fMotifEtat.trim(),
      )
      setCibleEtat(null)
      setFMotifEtat('')
      pousser('succes', `${reponse.nom} — ${reponse.actif ? t('cpt_actif') : t('cpt_inactif')}`)
      await chargerConfig()
    } catch (err) {
      // La garde des references inverses PARLE en 409 — on la laisse parler.
      setEtatErreur(fautesDe(err).join(' — '))
    } finally {
      setEnvoi(false)
    }
  }

  const charger = useCallback(async () => {
    setEtat({ phase: 'chargement' })
    try {
      const { telcos } = await lireTelcos()
      setEtat({ phase: 'pret', telcos })
    } catch (err) {
      setEtat({ phase: 'erreur', message: messageDe(err) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    void charger()
  }, [charger])

  // ── Les invariants, calculés à la frappe ──
  const regexEtat = useMemo(() => {
    if (fRegex.trim() === '') return null
    if (!fRegex.startsWith('^') || !fRegex.endsWith('$')) return t('tel_regex_invalide')
    try {
      new RegExp(fRegex)
    } catch {
      return t('tel_regex_invalide')
    }
    return null
  }, [fRegex, t])

  const exempleEtat = useMemo(() => {
    if (fExemple.trim() === '' || regexEtat !== null || fRegex.trim() === '') return null
    try {
      return new RegExp(fRegex).test(fExemple.trim()) ? null : t('tel_exemple_invalide')
    } catch {
      return null
    }
  }, [fExemple, fRegex, regexEtat, t])

  const sommeActuelle = useMemo(() => {
    if (etat.phase !== 'pret' || !fPays) return 0
    return (etat.telcos[fPays] ?? []).reduce((somme, telco) => somme + telco.part_marche, 0)
  }, [etat, fPays])

  const partEtat = useMemo(() => {
    const part = Number(fPart)
    if (fPart.trim() === '' || Number.isNaN(part)) return null
    return sommeActuelle + part > 100 ? t('tel_somme_depasse') : null
  }, [fPart, sommeActuelle, t])

  // ORDRE ALPHABETIQUE + recherche rapide (demande administration, 23/08).
  // On cherche sur le NOM de l'operateur, son code, ET les pays porteurs :
  // « qui opere au Cameroun ? » est la question la plus posee sur cet ecran.
  const telcosListe = useMemo(
    () => [...(configTelcos ?? [])].sort((a, b) => a.nom.localeCompare(b.nom, 'fr')),
    [configTelcos],
  )
  const fTelcos = useFiltreListe(
    telcosListe,
    (x) => [x.nom, x.code, ...x.porteurs],
    (x) => x.nom,
  )
  const pgTelcos = usePagination(fTelcos.resultat, 10, fTelcos.cle)

  const formulaireValide =
    fPays !== '' &&
    fNom.trim().length >= 2 &&
    fCode.trim().length >= 2 &&
    fRegex.trim().length >= 4 &&
    regexEtat === null &&
    fExemple.trim().length >= 6 &&
    exempleEtat === null &&
    fPart.trim() !== '' &&
    Number(fPart) > 0 &&
    partEtat === null

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (envoi || !formulaireValide) return
    setEnvoi(true)
    setErreurEnvoi(null)
    try {
      const reponse = await ajouterTelco({
        pays: fPays,
        network_name: fNom.trim(),
        short_name: fCode.trim(),
        regex_msisdn: fRegex.trim(),
        part_marche: Number(fPart),
        exemple_msisdn: fExemple.trim(),
      })
      pousser('succes', `${t('tel_cree')} ${reponse.somme_parts_du_pays}%`)
      setFormulaireOuvert(false)
      setFNom('')
      setFCode('')
      setFRegex('')
      setFPart('')
      setFExemple('')
      await charger()
    } catch (err) {
      setErreurEnvoi(messageDe(err))
    } finally {
      setEnvoi(false)
    }
  }

  const label = (texte: string) => (
    <label
      className="text-[10px] font-semibold uppercase tracking-wide mb-1 block"
      style={{ color: 'var(--text-muted)' }}
    >
      {texte}
    </label>
  )
  const erreurInline = (texte: string | null) =>
    texte && (
      <p className="text-[10px] mt-1" style={{ color: '#b91c1c' }} role="alert">
        {texte}
      </p>
    )

  if (etat.phase === 'chargement') {
    return (
      <div className="space-y-3">
        <Skeleton height={28} width={220} />
        <Skeleton height={260} />
      </div>
    )
  }
  if (etat.phase === 'erreur') {
    return (
      <div>
        <SectionHeader title={t('tel_titre')} />
        <Banniere ton="danger">{etat.message}</Banniere>
        <button className="btn-ghost text-xs mt-3" onClick={() => void charger()}>
          {t('retry')}
        </button>
      </div>
    )
  }

  const codesPays = Object.keys(etat.telcos).sort()

  return (
    <div className="animate-fade-in">
      <SectionHeader
        title={t('tel_titre')}
        subtitle={t('tel_sous_titre')}
        action={
          <button
            className="btn-primary text-xs"
            style={{ height: 30 }}
            onClick={() => setFormulaireOuvert(!formulaireOuvert)}
          >
            <Plus size={12} />
            {t('tel_ajouter')}
          </button>
        }
      />

      {formulaireOuvert && (
        <Card className="mb-4">
          <form onSubmit={soumettre}>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                {label(t('geo_pays_champ'))}
                <select className="input-base" value={fPays} onChange={(e) => setFPays(e.target.value)}>
                  <option value="">{t('geo_choisir')}</option>
                  {codesPays.map((code) => (
                    <option key={code} value={code}>
                      {code}
                    </option>
                  ))}
                </select>
                {fPays && (
                  <p className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
                    {t('tel_somme_actuelle')} : {sommeActuelle}%
                  </p>
                )}
              </div>
              <div>
                {label(t('tel_nom_reseau'))}
                <input className="input-base" value={fNom} onChange={(e) => setFNom(e.target.value)} />
              </div>
              <div>
                {label(t('tel_code_court'))}
                <input className="input-base font-mono" value={fCode} onChange={(e) => setFCode(e.target.value)} />
              </div>
              <div>
                {label(t('tel_regex'))}
                <input
                  className="input-base font-mono"
                  value={fRegex}
                  onChange={(e) => setFRegex(e.target.value)}
                  placeholder="^237(65[0-9])\d{6}$"
                />
                {erreurInline(regexEtat)}
              </div>
              <div>
                {label(t('tel_exemple'))}
                <input
                  className="input-base font-mono"
                  value={fExemple}
                  onChange={(e) => setFExemple(e.target.value)}
                />
                {erreurInline(exempleEtat)}
              </div>
              <div>
                {label(t('tel_part'))}
                <input
                  className="input-base font-mono"
                  type="number"
                  min={0.1}
                  max={100}
                  step="0.1"
                  value={fPart}
                  onChange={(e) => setFPart(e.target.value)}
                />
                {erreurInline(partEtat)}
              </div>
            </div>
            {erreurEnvoi && (
              <p className="text-xs rounded-lg px-3 py-2 mt-3" style={{ background: '#fee2e2', color: '#b91c1c' }} role="alert">
                {erreurEnvoi}
              </p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                className="btn-ghost text-xs"
                style={{ height: 30 }}
                onClick={() => setFormulaireOuvert(false)}
              >
                {t('cancel')}
              </button>
              <button
                className="btn-primary text-xs"
                style={{ height: 30, opacity: envoi || !formulaireValide ? 0.6 : 1 }}
                disabled={envoi || !formulaireValide}
              >
                {envoi ? t('loading') : t('save')}
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* ── LA-BAS : les operateurs de config-service, etat reel ── */}
      <Card className="mb-4">
        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-primary)' }}>
          {t('tel_config_titre')}
        </p>
        <p className="text-[10px] mb-3" style={{ color: 'var(--text-muted)' }}>
          {configNote || t('tel_config_note')}
        </p>
        {configErreur && (
          <>
            <Banniere ton="danger">{configErreur}</Banniere>
            <button className="btn-ghost text-xs mt-2" onClick={() => void chargerConfig()}>
              {t('retry')}
            </button>
          </>
        )}
        {configTelcos === null && configErreur === null && <Skeleton height={80} />}
        {configTelcos !== null && (
          <>
          <BarreFiltre
            filtre={fTelcos}
            items={telcosListe}
            initiale={(x) => x.nom}
            placeholder={t('flt_pays_telco')}
          />
          {fTelcos.resultat.length === 0 && (
            <p className="text-center text-xs py-6" style={{ color: 'var(--text-muted)' }}>
              {t('flt_vide')}
            </p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('tel_nom_reseau')}</th>
                  <th>{t('inv_col_etat')}</th>
                  <th>{t('tel_porteurs')}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {pgTelcos.pageItems.map((telco) => (
                  <tr key={telco.id}>
                    <td className="text-xs font-semibold">
                      {telco.nom}
                      {telco.code && (
                        <span className="font-mono text-[9px] ml-1" style={{ color: 'var(--text-muted)' }}>
                          {telco.code}
                        </span>
                      )}
                    </td>
                    <td>
                      {telco.actif === true && <span className="badge-secondary">{t('cpt_actif')}</span>}
                      {telco.actif === false && <span className="badge-danger">{t('cpt_inactif')}</span>}
                      {telco.actif === null && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td className="font-mono text-[10px]">{telco.porteurs.join(' · ') || '—'}</td>
                    <td>
                      <button
                        className="btn-ghost text-[11px]"
                        style={{ height: 24, color: telco.actif === false ? 'var(--secondary-dark)' : '#92400e' }}
                        onClick={() => {
                          setCibleEtat(telco)
                          setFMotifEtat('')
                          setEtatErreur(null)
                        }}
                      >
                        {telco.actif === false ? t('cpt_reactiver') : t('cpt_desactiver')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pager
            page={pgTelcos.page}
            nbPages={pgTelcos.nbPages}
            size={pgTelcos.size}
            total={pgTelcos.total}
            from={pgTelcos.from}
            to={pgTelcos.to}
            onPage={pgTelcos.setPage}
            onSize={pgTelcos.setSize}
          />
          </>
        )}
      </Card>

      <ConfirmDialog
        ouvert={cibleEtat !== null}
        titre={`${cibleEtat?.actif === false ? t('cpt_reactiver') : t('cpt_desactiver')} « ${cibleEtat?.nom} » ?`}
        libelleConfirmer={t('confirm')}
        libelleAnnuler={t('cancel')}
        danger={cibleEtat?.actif !== false}
        enCours={envoi}
        onConfirmer={() => void basculerEtat()}
        onAnnuler={() => setCibleEtat(null)}
      >
        <p className="mb-2">{t('tel_etat_verite')}</p>
        {cibleEtat && cibleEtat.porteurs.length > 1 && (
          <p className="mb-2 font-semibold" style={{ color: '#92400e' }}>
            {t('tel_etat_garde')} : {cibleEtat.porteurs.join(', ')}
          </p>
        )}
        <ChampLabel texte={t('cpt_motif')} requis />
        <input
          className="input-base"
          value={fMotifEtat}
          onChange={(e) => setFMotifEtat(e.target.value)}
          maxLength={200}
        />
        {etatErreur && (
          <p className="text-xs mt-2" style={{ color: '#b91c1c' }} role="alert">
            {etatErreur}
          </p>
        )}
      </ConfirmDialog>

      <div className="grid md:grid-cols-2 gap-4">
        {codesPays.map((code) => {
          const liste = etat.telcos[code]
          const somme = liste.reduce((total, telco) => total + telco.part_marche, 0)
          return (
            <Card key={code}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Radio size={14} style={{ color: 'var(--primary-dark)' }} />
                  <span className="font-mono font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                    {code}
                  </span>
                </div>
                <span
                  className={somme <= 100 ? 'badge-secondary' : 'badge-danger'}
                  title="INV-18"
                >
                  Σ {somme}%
                </span>
              </div>
              <div className="space-y-2">
                {liste.map((telco) => (
                  <div key={telco.code} className="rounded-lg px-3 py-2" style={{ background: 'var(--surface)' }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                        {telco.nom}
                      </span>
                      <span className="text-[10px] font-mono" style={{ color: 'var(--text-secondary)' }}>
                        {telco.part_marche}%
                      </span>
                    </div>
                    <div className="progress-bar mt-1.5" style={{ height: 4 }}>
                      <div className="progress-fill" style={{ width: `${telco.part_marche}%` }} />
                    </div>
                    <p className="text-[9px] font-mono mt-1 truncate" style={{ color: 'var(--text-muted)' }} title={telco.regex_msisdn}>
                      {telco.regex_msisdn}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
