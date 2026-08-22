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
    operation: 'var(--secondary-light)',
    geo: 'var(--primary-light)',
    fiche: 'var(--surface)',
  }

  return (
    <div className="relative">
      <style>{`
        @keyframes globe-pulse { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.4;transform:scale(1.65);} }
        .globe-clignote { animation: globe-pulse 1.6s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) { .globe-clignote { animation: none; } }
      `}</style>
      <div className="flex flex-wrap gap-4 items-center text-xs mb-2" style={{ color: 'var(--text-secondary)' }}>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px]"
            style={{ background: 'var(--secondary)' }}
          />
          {t('globe_operation')} ({compte.operation})
        </span>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px]"
            style={{ background: 'var(--primary)' }}
          />
          {t('globe_geo')} ({compte.geo})
        </span>
        <span>
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5 align-[-1px] border-2"
            style={{ borderColor: 'var(--text-secondary)' }}
          />
          {t('globe_fiche')} ({compte.fiche})
        </span>
        <span>
          · {villes.length} {t('globe_villes_gps')}
        </span>
      </div>
      <div
        className="rounded-xl overflow-hidden border"
        style={{ borderColor: 'var(--border)', background: 'var(--primary-light)' }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={t('globe_aria')} className="block w-full h-auto">
          {tracés.map(({ a2, d }) => {
            const fiche = parCode[a2]
            return (
              <path
                key={a2}
                d={d}
                fill={fiche ? FONDS[etatDe(fiche)] : 'var(--background)'}
                stroke="var(--border)"
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
              fill="var(--text-primary)"
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
                    <circle cx={cx} cy={cy} r={13} fill="var(--secondary)" opacity={0.25} className="globe-clignote" />
                    <circle cx={cx} cy={cy} r={7} fill="var(--secondary)" stroke="var(--surface)" strokeWidth={2} className="globe-clignote" />
                  </>
                )}
                {etat === 'geo' && (
                  <circle cx={cx} cy={cy} r={6} fill="var(--primary-dark)" stroke="var(--surface)" strokeWidth={2} />
                )}
                {etat === 'fiche' && (
                  <circle cx={cx} cy={cy} r={5.5} fill="none" stroke="var(--text-secondary)" strokeWidth={2.5} />
                )}
                <text
                  x={cx}
                  y={cy - 11}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={600}
                  fill="var(--text-primary)"
                >
                  {a2}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
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
                  ? 'var(--secondary-dark)'
                  : etatDe(bulle.fiche) === 'geo'
                    ? 'var(--primary-dark)'
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
