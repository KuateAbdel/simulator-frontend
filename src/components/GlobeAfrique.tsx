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

import { useCallback, useMemo, useRef, useState } from 'react'
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

// ZOOM CARTOGRAPHIQUE (23/08, demande administration) — le patron des vraies
// cartes, pas un `transform: scale()` sur une image.
//
// Tout se joue sur le `viewBox` du SVG : on ne redessine rien, on regarde une
// FENETRE plus petite du meme tracé. Consequences voulues : les frontieres
// restent nettes a tout niveau (c'est du vectoriel, pas du pixel), les
// epaisseurs de trait restent constantes a l'ecran (on les divise par le
// zoom), et l'echelle affichee reste VRAIE.
//
// Le zoom est ANCRE AU CURSEUR : le point sous la souris ne bouge pas pendant
// le zoom. C'est ce que fait toute carte serieuse, et son absence est la
// premiere chose qu'un utilisateur ressent comme « ca glisse ».
const ZOOM_MIN = 1
const ZOOM_MAX = 12

/** La projection est equirectangulaire : l'echelle varie avec la latitude
 *  (facteur cos φ). Une barre d'echelle honnete l'annonce donc pour la
 *  latitude du CENTRE de la vue — c'est ce que font les cartes papier. */
const KM_PAR_DEGRE = 111.32

/** Les paliers d'une barre d'echelle de carte : 1-2-5 par decade. */
const PALIERS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000]

type EtatPays = 'operation' | 'geo' | 'fiche'

function etatDe(fiche: FichePays): EtatPays {
  if (fiche.sur_config_service) return 'operation'
  if (fiche.completude.regions > 0) return 'geo'
  return 'fiche'
}

type Bulle = { x: number; y: number; fiche: FichePays } | null

/** Encombrement de l'infobulle. Fixe et non mesure : mesurer imposerait un
 *  rendu invisible avant chaque affichage, et l'infobulle sauterait d'un
 *  pixel a l'apparition. Une largeur imposee est plus stable qu'une largeur
 *  devinee — et elle rend le choix de bascule DETERMINISTE. */
const LARGEUR_BULLE = 250
const HAUTEUR_BULLE = 108

export function GlobeAfrique({
  fiches,
  geographie,
}: {
  fiches: FichePays[]
  geographie: PaysGeo[]
}) {
  const { t } = useApp()
  const [bulle, setBulle] = useState<Bulle>(null)

  // --- La VUE : un zoom et un centre, en coordonnees carte -----------------
  const [zoom, setZoom] = useState(1)
  const [centre, setCentre] = useState({ x: W / 2, y: H / 2 })
  const svgRef = useRef<SVGSVGElement | null>(null)
  const glisse = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null)

  const largeurVue = W / zoom
  const hauteurVue = H / zoom

  /** Le centre reste dans la carte : on ne peut pas panoramiquer dans le vide.
   *  Sans ce clamp, un glissement un peu vif sort de la carte et l'ecran
   *  devient bleu — l'utilisateur croit avoir casse quelque chose. */
  const borner = useCallback(
    (x: number, y: number, z: number) => {
      const lv = W / z / 2
      const hv = H / z / 2
      return {
        x: Math.min(W - lv, Math.max(lv, x)),
        y: Math.min(H - hv, Math.max(hv, y)),
      }
    },
    [],
  )

  /** Zoom ANCRE : le point vise ne bouge pas. C'est la difference entre une
   *  carte et une image agrandie. */
  const zoomerVers = useCallback(
    (facteur: number, ancre?: { x: number; y: number }) => {
      setZoom((zPrec) => {
        const z = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zPrec * facteur))
        if (z === zPrec) return zPrec
        setCentre((c) => {
          if (!ancre) return borner(c.x, c.y, z)
          // Le point d'ancrage garde sa position ECRAN : on deplace le centre
          // de la fraction exacte que le changement d'echelle lui aurait fait
          // parcourir.
          const k = 1 - zPrec / z
          return borner(c.x + (ancre.x - c.x) * k, c.y + (ancre.y - c.y) * k, z)
        })
        return z
      })
    },
    [borner],
  )

  /** Coordonnees CARTE d'un evenement souris — jamais des pixels ecran. */
  const pointCarte = useCallback(
    (e: { clientX: number; clientY: number }) => {
      const svg = svgRef.current
      if (!svg) return { x: centre.x, y: centre.y }
      const r = svg.getBoundingClientRect()
      return {
        x: centre.x - largeurVue / 2 + ((e.clientX - r.left) / r.width) * largeurVue,
        y: centre.y - hauteurVue / 2 + ((e.clientY - r.top) / r.height) * hauteurVue,
      }
    },
    [centre, largeurVue, hauteurVue],
  )

  /** La barre d'echelle : une distance RONDE qui tient dans ~130 px.
   *  Annoncee pour la latitude du centre de la vue, parce que c'est la que
   *  l'echelle d'une projection equirectangulaire est juste. */
  const echelle = useMemo(() => {
    const latitudeCentre = LAT0 - (centre.y / H) * (LAT0 - LAT1)
    const degresParPixel = (LON1 - LON0) / W / zoom
    const kmParPixel = degresParPixel * KM_PAR_DEGRE * Math.cos((latitudeCentre * Math.PI) / 180)
    const cible = kmParPixel * 130
    const km = PALIERS.find((p) => p >= cible) ?? PALIERS[PALIERS.length - 1]
    return { km, pixels: Math.round(km / kmParPixel) }
  }, [centre.y, zoom])

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
        /* Commandes POSEES SUR la carte — elles ne volent pas de hauteur au
           tracé, et restent atteignables au pouce sur mobile. */
        .globe-cmd { position: absolute; top: .6rem; right: .6rem; z-index: 2;
          display: flex; flex-direction: column; gap: 2px; }
        .globe-cmd button { width: 30px; height: 30px; line-height: 1;
          font-size: 15px; font-weight: 600; cursor: pointer;
          color: var(--globe-encre); background: var(--surface, #fff);
          border: 1px solid var(--border); border-radius: 6px;
          box-shadow: 0 1px 3px rgb(0 0 0 / .16); }
        .globe-cmd button:hover:not(:disabled) { background: var(--surface-hover, #f3f4f6); }
        .globe-cmd button:disabled { opacity: .45; cursor: default; }
        .globe-cmd button:focus-visible { outline: 2px solid var(--primary); outline-offset: 1px; }
        /* Echelle : une distance RONDE, vraie pour la latitude du centre. */
        .globe-echelle { position: absolute; left: .7rem; bottom: .7rem; z-index: 2;
          display: flex; align-items: center; gap: .45rem; font-size: 10px;
          color: var(--globe-encre); background: color-mix(in srgb, var(--surface, #fff) 82%, transparent);
          padding: .2rem .45rem; border-radius: 4px; }
        .globe-echelle-barre { height: 3px; background: var(--globe-encre);
          border-left: 2px solid var(--globe-encre); border-right: 2px solid var(--globe-encre);
          box-sizing: content-box; }
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
        className="rounded-xl overflow-hidden border relative"
        style={{ borderColor: 'var(--border)', background: 'var(--globe-mer)' }}
      >
        {/* LES COMMANDES — posees SUR la carte, comme sur toute carte. Elles
            ne prennent pas de place au-dessus et restent sous le pouce. */}
        <div className="globe-cmd" role="group" aria-label={t('globe_zoom_aria')}>
          <button type="button" onClick={() => zoomerVers(1.6)} aria-label={t('globe_zoom_plus')}>
            +
          </button>
          <button type="button" onClick={() => zoomerVers(1 / 1.6)} aria-label={t('globe_zoom_moins')}>
            −
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1)
              setCentre({ x: W / 2, y: H / 2 })
            }}
            aria-label={t('globe_zoom_reset')}
            disabled={zoom === 1}
            title={t('globe_zoom_reset')}
          >
            ⤢
          </button>
        </div>

        {/* L'ECHELLE — une distance ronde, vraie pour la latitude du centre. */}
        <div className="globe-echelle" aria-hidden="true">
          <div className="globe-echelle-barre" style={{ width: `${echelle.pixels}px` }} />
          <span>{echelle.km} km</span>
        </div>

        <svg
          ref={svgRef}
          viewBox={`${centre.x - largeurVue / 2} ${centre.y - hauteurVue / 2} ${largeurVue} ${hauteurVue}`}
          role="img"
          aria-label={t('globe_aria')}
          className="block w-full h-auto"
          style={{
            maxHeight: '62vh',
            cursor: glisse.current ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
            touchAction: 'none',
          }}
          onWheel={(e) => {
            // Molette = zoom ANCRE au curseur. `deltaY` negatif = vers l'avant.
            e.preventDefault()
            zoomerVers(e.deltaY < 0 ? 1.18 : 1 / 1.18, pointCarte(e))
          }}
          onPointerDown={(e) => {
            if (zoom === 1) return // rien a panoramiquer a l'echelle d'origine
            e.currentTarget.setPointerCapture(e.pointerId)
            glisse.current = { x: e.clientX, y: e.clientY, cx: centre.x, cy: centre.y }
            setBulle(null) // pendant un panoramique, elle clignoterait sur
            // chaque pays traverse — on deplace la carte, on ne l'inspecte pas
          }}
          onPointerMove={(e) => {
            const g = glisse.current
            if (!g) return
            const r = e.currentTarget.getBoundingClientRect()
            // Le deplacement ECRAN converti en deplacement CARTE : la carte
            // suit le doigt exactement, quel que soit le zoom.
            setCentre(
              borner(
                g.cx - ((e.clientX - g.x) / r.width) * largeurVue,
                g.cy - ((e.clientY - g.y) / r.height) * hauteurVue,
                zoom,
              ),
            )
          }}
          onPointerUp={() => {
            glisse.current = null
          }}
          onPointerCancel={() => {
            glisse.current = null
          }}
        >
          {tracés.map(({ a2, d }) => {
            const fiche = parCode[a2]
            return (
              <path
                key={a2}
                d={d}
                fill={fiche ? FONDS[etatDe(fiche)] : 'var(--globe-hors)'}
                stroke="var(--globe-frontiere)"
                strokeWidth={0.7 / zoom}
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
              r={1.4 / zoom}
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
                    <circle cx={cx} cy={cy} r={13 / zoom} fill="var(--globe-op)" opacity={0.25} className="globe-clignote" />
                    <circle cx={cx} cy={cy} r={7 / zoom} fill="var(--globe-op)" stroke="var(--globe-mer)" strokeWidth={2 / zoom} className="globe-clignote" />
                  </>
                )}
                {etat === 'geo' && (
                  <circle cx={cx} cy={cy} r={6 / zoom} fill="var(--globe-geo)" stroke="var(--globe-mer)" strokeWidth={2 / zoom} />
                )}
                {etat === 'fiche' && (
                  <circle cx={cx} cy={cy} r={5.5 / zoom} fill="none" stroke="var(--globe-fiche)" strokeWidth={2.5 / zoom} />
                )}
                <text
                  x={cx}
                  y={cy - 11}
                  textAnchor="middle"
                  fontSize={11 / zoom}
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
            // ELLE BASCULE, elle ne s'epingle PAS (correction 23/08).
            //
            // L'ancienne regle `Math.min(x + 14, innerWidth - 260)` collait la
            // bulle au bord droit des qu'on s'en approchait : le curseur
            // continuait vers la droite, la bulle restait sur place, et le
            // lien entre le pays survole et l'information affichee se cassait
            // au moment precis ou on en avait besoin.
            //
            // Une bulle de carte se place du cote OU IL Y A LA PLACE, et reste
            // a distance constante du curseur — 10 px, assez pour ne pas
            // recouvrir le pays vise, assez peu pour rester solidaire.
            left: bulle.x + 10 + LARGEUR_BULLE > window.innerWidth
              ? bulle.x - 10 - LARGEUR_BULLE
              : bulle.x + 10,
            top: bulle.y + 10 + HAUTEUR_BULLE > window.innerHeight
              ? Math.max(6, bulle.y - 10 - HAUTEUR_BULLE)
              : bulle.y + 10,
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
            width: LARGEUR_BULLE,
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
