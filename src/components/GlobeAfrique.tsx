// src/components/GlobeAfrique.tsx — le globe VIVANT du référentiel (22/08).
//
// La doctrine qu'il dessine : le Loader PORTE l'information (il peut porter
// le globe entier) ; l'OPÉRATION est définie par la plateforme. Un pays qui
// CLIGNOTE est présent des deux côtés — Loader ET config-service — et cet
// état vient de `GET /admin/referentiels/pays`, vérifié en direct à chaque
// chargement : pousser un pays en opération, recharger, il clignote.
//
// Fond de carte : Natural Earth 1:50m (le référentiel cartographique des
// rédactions — libre, contrairement aux tracés Google). Villes : les
// coordonnées réelles du référentiel (±1 km).
//
// Couleurs = les tokens FinZuu (JJB) : vert `--secondary` = en opération,
// violet `--primary` = géographie prête, neutre = fiche seule. L'état n'est
// JAMAIS la couleur seule : plein-clignotant / plein / anneau creux.

import { useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import type { FichePays, PaysGeo } from '../lib/api'
import FRONTIERES from '../data/afrique-frontieres.json'

type Frontiere = { a2: string; polys: number[][][][] }

const LAT0 = 38
const LAT1 = -36
const LON0 = -19
const LON1 = 53
const W = 980
const H = 1000

const px = (lon: number) => ((lon - LON0) / (LON1 - LON0)) * W
const py = (lat: number) => ((LAT0 - lat) / (LAT0 - LAT1)) * H

type EtatPays = 'operation' | 'geo' | 'fiche'

function etatDe(fiche: FichePays): EtatPays {
  if (fiche.sur_config_service) return 'operation'
  if (fiche.completude.regions > 0) return 'geo'
  return 'fiche'
}

type Bulle = { x: number; y: number; fiche: FichePays } | null

export function GlobeAfrique({
  fiches,
  geographie,
}: {
  fiches: FichePays[]
  geographie: PaysGeo[]
}) {
  const { t } = useApp()
  const [bulle, setBulle] = useState<Bulle>(null)

  const parCode = useMemo(() => {
    const index: Record<string, FichePays> = {}
    for (const fiche of fiches) index[fiche.iso2] = fiche
    return index
  }, [fiches])

  // Villes géolocalisées : l'arbre US-B5 porte déjà lat/lon — aucune donnée
  // parallèle, le globe lit LE référentiel que le prochain run utilisera.
  const villes = useMemo(() => {
    const points: { lo: number; la: number }[] = []
    for (const pays of geographie)
      for (const region of pays.regions)
        for (const ville of region.villes)
          if (ville.latitude !== null && ville.longitude !== null)
            points.push({ lo: ville.longitude, la: ville.latitude })
    return points
  }, [geographie])

  const { tracés, centroides } = useMemo(() => {
    const dessins: { a2: string; d: string }[] = []
    const centres: Record<string, [number, number]> = {}
    for (const f of FRONTIERES as Frontiere[]) {
      let d = ''
      let meilleur = 0
      for (const poly of f.polys) {
        for (const anneau of poly) {
          d +=
            'M' +
            anneau.map(([lo, la]) => `${px(lo).toFixed(1)},${py(la).toFixed(1)}`).join('L') +
            'Z'
        }
        const exterieur = poly[0]
        if (exterieur.length > meilleur) {
          meilleur = exterieur.length
          let sx = 0
          let sy = 0
          for (const [lo, la] of exterieur) {
            sx += px(lo)
            sy += py(la)
          }
          centres[f.a2] = [sx / exterieur.length, sy / exterieur.length]
        }
      }
      dessins.push({ a2: f.a2, d })
    }
    return { tracés: dessins, centroides: centres }
  }, [])

  const compte = useMemo(() => {
    const c = { operation: 0, geo: 0, fiche: 0 }
    for (const fiche of fiches) c[etatDe(fiche)] += 1
    return c
  }, [fiches])

  const FONDS: Record<EtatPays, string> = {
    operation: 'var(--globe-op-fond)',
    geo: 'var(--globe-geo-fond)',
    fiche: 'var(--globe-fiche-fond)',
  }

  return (
    <div className="relative globe-scope">
      <style>{`
        .globe-scope {
          --globe-mer: #DCE8EE; --globe-hors: #EDEAE0; --globe-frontiere: #B9B4A5;
          --globe-op: #15803D; --globe-op-fond: #CFE8D6;
          --globe-geo: #B45309; --globe-geo-fond: #F3DFC4;
          --globe-fiche: #64748B; --globe-fiche-fond: #E4E7EC;
          --globe-encre: #20261F;
        }
        :root[data-theme='dark'] .globe-scope {
          --globe-mer: #141E26; --globe-hors: #232920; --globe-frontiere: #4A5244;
          --globe-op: #4ADE80; --globe-op-fond: #1D3A28;
          --globe-geo: #F59E0B; --globe-geo-fond: #33291A;
          --globe-fiche: #94A3B8; --globe-fiche-fond: #2A313C;
          --globe-encre: #E7E5DC;
        }
        @keyframes globe-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(1.65);} }
        .globe-clignote { animation: globe-pulse 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { .globe-clignote { animation: none; } }
      `}</style>
      <div className="flex flex-wrap gap-4 items-center text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px]"
            style={{ background: 'var(--globe-op)' }}
          />
          {t('globe_operation')} ({compte.operation})
        </span>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px]"
            style={{ background: 'var(--globe-geo)' }}
          />
          {t('globe_geo')} ({compte.geo})
        </span>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px] border-2"
            style={{ borderColor: 'var(--globe-fiche)' }}
          />
          {t('globe_fiche')} ({compte.fiche})
        </span>
        <span>
          · {villes.length} {t('globe_villes_gps')}
        </span>
      </div>
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'var(--border)', background: 'var(--globe-mer)' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('globe_aria')} className="block w-full h-auto">
          {tracés.map(({ a2, d }) => {
            const fiche = parCode[a2]
            return (
              <path
                key={a2}
                d={d}
                fill={fiche ? FONDS[etatDe(fiche)] : 'var(--globe-hors)'}
                stroke="var(--globe-frontiere)"
                strokeWidth={0.7}
                style={fiche ? { cursor: 'pointer' } : undefined}
                onMouseMove={
                  fiche
                    ? (ev) => setBulle({ x: ev.clientX, y: ev.clientY, fiche })
                    : undefined
                }
                onMouseLeave={fiche ? () => setBulle(null) : undefined}
              />
            )
          })}
          {villes.map((v, i) => (
            <circle
              key={i}
              cx={px(v.lo).toFixed(1)}
              cy={py(v.la).toFixed(1)}
              r={1.4}
              fill="var(--globe-encre)"
              opacity={0.35}
            />
          ))}
          {Object.entries(centroides).map(([a2, [cx, cy]]) => {
            const fiche = parCode[a2]
            if (!fiche) return null
            const etat = etatDe(fiche)
            return (
              <g key={a2} pointerEvents="none">
                {etat === 'operation' && (
                  <>
                    <circle cx={cx} cy={cy} r={13} fill="var(--globe-op)" opacity={0.25} className="globe-clignote" />
                    <circle cx={cx} cy={cy} r={7} fill="var(--globe-op)" stroke="var(--globe-mer)" strokeWidth={2} className="globe-clignote" />
                  </>
                )}
                {etat === 'geo' && (
                  <circle cx={cx} cy={cy} r={6} fill="var(--globe-geo)" stroke="var(--globe-mer)" strokeWidth={2} />
                )}
                {etat === 'fiche' && (
                  <circle cx={cx} cy={cy} r={5.5} fill="none" stroke="var(--globe-fiche)" strokeWidth={2.5} />
                )}
                <text
                  x={cx}
                  y={cy - 11}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--globe-encre)"
                >
                  {a2}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
      <details className="mt-3">
        <summary className="cursor-pointer text-xs" style={{ color: 'var(--text-secondary)' }}>
          {t('globe_table')} ({fiches.length})
        </summary>
        <div className="overflow-x-auto mt-2">
          <table className="w-full text-xs" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--text-secondary)' }}>
                {[t('globe_col_pays'), t('globe_col_etat'), t('globe_col_devise'),
                  t('globe_col_tva'), t('geo_regions'), t('geo_villes'), t('geo_quartiers')].map(
                  (entete) => (
                    <th key={entete} className="text-left px-2 py-1 border-b"
                        style={{ borderColor: 'var(--border)' }}>
                      {entete}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {fiches.map((fiche) => {
                const etat = etatDe(fiche)
                return (
                  <tr key={fiche.iso2} style={{ color: 'var(--text-primary)' }}>
                    <td className="px-2 py-1 border-b" style={{ borderColor: 'var(--border)' }}>
                      {fiche.nom_fr} ({fiche.iso2})
                    </td>
                    <td className="px-2 py-1 border-b font-semibold"
                        style={{ borderColor: 'var(--border)',
                                 color: etat === 'operation' ? 'var(--globe-op)'
                                   : etat === 'geo' ? 'var(--globe-geo)' : 'var(--globe-fiche)' }}>
                      {etat === 'operation' ? t('globe_etat_operation')
                        : etat === 'geo' ? t('globe_etat_geo') : t('globe_etat_fiche')}
                    </td>
                    <td className="px-2 py-1 border-b" style={{ borderColor: 'var(--border)' }}>{fiche.devise_iso}</td>
                    <td className="px-2 py-1 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.tva_percent}</td>
                    <td className="px-2 py-1 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.regions}</td>
                    <td className="px-2 py-1 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.villes}</td>
                    <td className="px-2 py-1 border-b text-right tabular-nums" style={{ borderColor: 'var(--border)' }}>{fiche.completude.quartiers}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>
      {bulle && (
        <div
          className="fixed z-50 rounded-xl border px-3 py-2 text-xs shadow-lg pointer-events-none"
          style={{
            left: Math.min(bulle.x + 14, window.innerWidth - 260),
            top: bulle.y + 14,
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            maxWidth: 250,
          }}
        >
          <div className="font-semibold">
            {bulle.fiche.nom_fr} ({bulle.fiche.iso2})
          </div>
          <div
            className="font-semibold"
            style={{
              color:
                etatDe(bulle.fiche) === 'operation'
                  ? 'var(--globe-op)'
                  : etatDe(bulle.fiche) === 'geo'
                    ? 'var(--globe-geo)'
                    : 'var(--text-secondary)',
            }}
          >
            {etatDe(bulle.fiche) === 'operation'
              ? t('globe_etat_operation')
              : etatDe(bulle.fiche) === 'geo'
                ? t('globe_etat_geo')
                : t('globe_etat_fiche')}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {bulle.fiche.devise_iso} · TVA {bulle.fiche.tva_percent} % ·{' '}
            {bulle.fiche.completude.regions} {t('geo_regions')} · {bulle.fiche.completude.villes}{' '}
            {t('geo_villes')} · {bulle.fiche.completude.quartiers} {t('geo_quartiers')}
          </div>
        </div>
      )}
    </div>
  )
}
