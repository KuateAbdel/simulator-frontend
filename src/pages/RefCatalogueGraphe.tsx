// src/pages/RefCatalogueGraphe.tsx — la constellation industries ↔ secteurs.
//
// Un vrai graphe FORCE-DIRECTED (répulsion + ressorts + gravité), comme le font
// les ingénieurs dataviz (famille D3-force). 6 hubs (industries) + 112 nœuds
// (secteurs) reliés en n:n. Moteur écrit à la main — pas de dépendance, bundle
// léger. La simulation tourne hors de React (mutation directe du DOM SVG via
// refs) : re-rendre 118 nœuds à 60 fps par setState serait injouable.

import { useEffect, useMemo, useRef } from 'react'

export type InfoSurvol =
  | { kind: 'hub'; label: string; n: number }
  | { kind: 'sec'; label: string; inds: string[] }
  | null

type Noeud = {
  id: string
  kind: 'hub' | 'sec'
  label: string
  color: string
  r: number
  mass: number
  inds: string[]
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number // ancre (hubs seulement)
  fixe: boolean
}

const W = 860
const H = 540
const CX = W / 2
const CY = H / 2

export function GrapheForce({
  industries,
  secteurs,
  couleur,
  membres,
  onHover,
}: {
  industries: string[]
  secteurs: Record<string, string[]>
  couleur: (l: string) => string
  membres: Record<string, number>
  onHover: (i: InfoSurvol) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const viewRef = useRef<SVGGElement>(null)
  const circleRefs = useRef<Map<string, SVGCircleElement>>(new Map())
  const lineRefs = useRef<Array<{ el: SVGLineElement; a: string; b: string }>>([])
  const hubLabelRefs = useRef<Map<string, SVGTextElement>>(new Map())
  // Vue (zoom/pan) — pilotée hors React, appliquée en transform sur le groupe.
  const view = useRef({ tx: 0, ty: 0, k: 1 })

  const { nodes, links } = useMemo(() => {
    const nodes: Noeud[] = []
    const byId = new Map<string, Noeud>()
    const maxMem = Math.max(1, ...Object.values(membres))
    industries.forEach((ind, i) => {
      const a = -Math.PI / 2 + i * ((Math.PI * 2) / industries.length)
      const ax = CX + 190 * Math.cos(a)
      const ay = CY + 175 * Math.sin(a)
      const n: Noeud = {
        id: `i:${ind}`,
        kind: 'hub',
        label: ind,
        color: couleur(ind),
        r: 16 + ((membres[ind] ?? 0) / maxMem) * 16,
        mass: 12,
        inds: [ind],
        x: ax,
        y: ay,
        vx: 0,
        vy: 0,
        ax,
        ay,
        fixe: false,
      }
      nodes.push(n)
      byId.set(n.id, n)
    })
    const primaire = (l: string[]) => [...l].sort()[0]
    Object.entries(secteurs).forEach(([label, inds], k) => {
      const p = primaire(inds)
      const ang = (k / Object.keys(secteurs).length) * Math.PI * 2
      const n: Noeud = {
        id: `s:${label}`,
        kind: 'sec',
        label,
        color: couleur(p),
        r: inds.length > 1 ? 6 : 4.5,
        mass: 1,
        inds,
        x: CX + Math.cos(ang) * 60 + (Math.random() - 0.5) * 40,
        y: CY + Math.sin(ang) * 60 + (Math.random() - 0.5) * 40,
        vx: 0,
        vy: 0,
        ax: 0,
        ay: 0,
        fixe: false,
      }
      nodes.push(n)
      byId.set(n.id, n)
    })
    const links: Array<{ a: string; b: string }> = []
    Object.entries(secteurs).forEach(([label, inds]) => {
      inds.forEach((ind) => links.push({ a: `s:${label}`, b: `i:${ind}` }))
    })
    return { nodes, links, byId }
  }, [industries, secteurs, membres, couleur])

  useEffect(() => {
    const byId = new Map(nodes.map((n) => [n.id, n]))
    let alpha = 1
    let raf = 0
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const tick = () => {
      // gravité vers le centre + ancre des hubs
      for (const n of nodes) {
        if (n.fixe) continue
        n.vx += (CX - n.x) * 0.0016
        n.vy += (CY - n.y) * 0.0016
        if (n.kind === 'hub') {
          n.vx += (n.ax - n.x) * 0.045
          n.vy += (n.ay - n.y) * 0.045
        }
      }
      // répulsion O(n²) (118 nœuds → ok)
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i]
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j]
          let dx = a.x - b.x
          let dy = a.y - b.y
          let d2 = dx * dx + dy * dy || 0.01
          const rep = (a.kind === 'hub' || b.kind === 'hub' ? 900 : 240) / d2
          const d = Math.sqrt(d2)
          const fx = (dx / d) * rep
          const fy = (dy / d) * rep
          if (!a.fixe) {
            a.vx += fx / a.mass
            a.vy += fy / a.mass
          }
          if (!b.fixe) {
            b.vx -= fx / b.mass
            b.vy -= fy / b.mass
          }
        }
      }
      // ressorts des liens
      for (const l of links) {
        const a = byId.get(l.a)
        const b = byId.get(l.b)
        if (!a || !b) continue
        const dx = b.x - a.x
        const dy = b.y - a.y
        const d = Math.sqrt(dx * dx + dy * dy) || 0.01
        const k = (d - 96) * 0.02
        const fx = (dx / d) * k
        const fy = (dy / d) * k
        if (!a.fixe) {
          a.vx += fx / a.mass
          a.vy += fy / a.mass
        }
        if (!b.fixe) {
          b.vx -= fx / b.mass
          b.vy -= fy / b.mass
        }
      }
      // intégration + amortissement + bornes
      for (const n of nodes) {
        if (n.fixe) continue
        n.vx *= 0.86
        n.vy *= 0.86
        n.x += n.vx * (0.4 + alpha)
        n.y += n.vy * (0.4 + alpha)
        n.x = Math.max(n.r + 4, Math.min(W - n.r - 4, n.x))
        n.y = Math.max(n.r + 4, Math.min(H - n.r - 4, n.y))
      }
      // écrire dans le DOM
      for (const n of nodes) {
        const c = circleRefs.current.get(n.id)
        if (c) {
          c.setAttribute('cx', n.x.toFixed(1))
          c.setAttribute('cy', n.y.toFixed(1))
        }
        if (n.kind === 'hub') {
          const tl = hubLabelRefs.current.get(n.id)
          if (tl) {
            tl.setAttribute('x', n.x.toFixed(1))
            tl.setAttribute('y', (n.y + n.r + 13).toFixed(1))
          }
        }
      }
      for (const { el, a, b } of lineRefs.current) {
        const na = byId.get(a)
        const nb = byId.get(b)
        if (!na || !nb) continue
        el.setAttribute('x1', na.x.toFixed(1))
        el.setAttribute('y1', na.y.toFixed(1))
        el.setAttribute('x2', nb.x.toFixed(1))
        el.setAttribute('y2', nb.y.toFixed(1))
      }
      alpha *= 0.985
      if (alpha > 0.008) raf = requestAnimationFrame(tick)
    }

    if (reduce) {
      for (let i = 0; i < 240; i++) tick.call(null)
    } else {
      raf = requestAnimationFrame(tick)
    }

    // ---- interactions : drag + hover ----
    const svg = svgRef.current
    let drag: Noeud | null = null
    // Vue (zoom/pan) — reinitialisee a chaque reconstruction du graphe.
    view.current = { tx: 0, ty: 0, k: 1 }
    const applyView = () => {
      const v = view.current
      viewRef.current?.setAttribute('transform', `translate(${v.tx} ${v.ty}) scale(${v.k})`)
    }
    applyView()
    // client -> coordonnees SVG (viewBox), hors transform de vue
    const toSvg = (e: PointerEvent) => {
      const pt = svg!.createSVGPoint()
      pt.x = e.clientX
      pt.y = e.clientY
      const m = svg!.getScreenCTM()
      if (!m) return { x: 0, y: 0 }
      const p = pt.matrixTransform(m.inverse())
      return { x: p.x, y: p.y }
    }
    // client -> coordonnees du GRAPHE (dans le groupe zoome/pane)
    const toGraph = (e: PointerEvent) => {
      const { x, y } = toSvg(e)
      const v = view.current
      return { x: (x - v.tx) / v.k, y: (y - v.ty) / v.k }
    }
    let pan: { sx: number; sy: number; tx0: number; ty0: number } | null = null
    const onDown = (e: PointerEvent) => {
      const id = (e.target as Element).getAttribute?.('data-id')
      if (id) {
        const n = byId.get(id)
        if (!n) return
        drag = n
        n.fixe = true
        alpha = Math.max(alpha, 0.5)
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(tick)
        ;(e.target as Element).setPointerCapture?.(e.pointerId)
      } else {
        // fond vide -> pan de la vue
        const { x, y } = toSvg(e)
        pan = { sx: x, sy: y, tx0: view.current.tx, ty0: view.current.ty }
        if (svg) svg.style.cursor = 'grabbing'
      }
    }
    const onMove = (e: PointerEvent) => {
      if (drag) {
        const { x, y } = toGraph(e)
        drag.x = x
        drag.y = y
        drag.vx = 0
        drag.vy = 0
        return
      }
      if (pan) {
        const { x, y } = toSvg(e)
        view.current.tx = pan.tx0 + (x - pan.sx)
        view.current.ty = pan.ty0 + (y - pan.sy)
        applyView()
        return
      }
      const id = (e.target as Element).getAttribute?.('data-id')
      if (!id) {
        onHover(null)
        return
      }
      const n = byId.get(id)
      if (!n) return
      onHover(n.kind === 'hub' ? { kind: 'hub', label: n.label, n: membres[n.label] ?? 0 } : { kind: 'sec', label: n.label, inds: n.inds })
      for (const { el, a, b } of lineRefs.current) {
        const on = a === id || b === id
        el.setAttribute('stroke-opacity', on ? '0.75' : '0.06')
        el.setAttribute('stroke-width', on ? '1.6' : '0.8')
      }
    }
    const onUp = () => {
      if (drag && drag.kind === 'sec') drag.fixe = false
      drag = null
      pan = null
      if (svg) svg.style.cursor = 'grab'
    }
    const onLeave = () => {
      onHover(null)
      for (const { el } of lineRefs.current) {
        el.setAttribute('stroke-opacity', '0.22')
        el.setAttribute('stroke-width', '1')
      }
    }
    // molette -> zoom vers le curseur (point sous la souris reste fixe)
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const { x, y } = toSvg(e as unknown as PointerEvent)
      const v = view.current
      const facteur = e.deltaY < 0 ? 1.12 : 1 / 1.12
      const k1 = Math.max(0.4, Math.min(4, v.k * facteur))
      v.tx = x - (x - v.tx) * (k1 / v.k)
      v.ty = y - (y - v.ty) * (k1 / v.k)
      v.k = k1
      applyView()
    }
    svg?.addEventListener('pointerdown', onDown)
    svg?.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    svg?.addEventListener('pointerleave', onLeave)
    svg?.addEventListener('wheel', onWheel, { passive: false })

    return () => {
      cancelAnimationFrame(raf)
      svg?.removeEventListener('pointerdown', onDown)
      svg?.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      svg?.removeEventListener('pointerleave', onLeave)
      svg?.removeEventListener('wheel', onWheel)
    }
  }, [nodes, links, membres, onHover])

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', minWidth: 640, height: 'auto', display: 'block', touchAction: 'none', cursor: 'grab' }}
      role="img"
      aria-label="Constellation force-directed des industries et secteurs"
    >
      <g ref={viewRef}>
      <g>
        {links.map((l, i) => (
          <line
            key={i}
            ref={(el) => {
              if (el) lineRefs.current[i] = { el, a: l.a, b: l.b }
            }}
            stroke="var(--text-muted)"
            strokeOpacity={0.22}
            strokeWidth={1}
          />
        ))}
      </g>
      <g>
        {nodes.map((n) => (
          <circle
            key={n.id}
            data-id={n.id}
            ref={(el) => {
              if (el) circleRefs.current.set(n.id, el)
            }}
            r={n.r}
            fill={n.kind === 'hub' ? `${n.color}26` : n.color}
            stroke={n.color}
            strokeWidth={n.kind === 'hub' ? 2 : 1}
            style={{ cursor: n.kind === 'hub' ? 'grab' : 'pointer' }}
          />
        ))}
      </g>
      <g style={{ pointerEvents: 'none' }}>
        {nodes
          .filter((n) => n.kind === 'hub')
          .map((n) => (
            <text
              key={n.id}
              ref={(el) => {
                if (el) hubLabelRefs.current.set(n.id, el)
              }}
              textAnchor="middle"
              fontSize={12}
              fontWeight={700}
              fill="var(--text-primary)"
            >
              {n.label}
            </text>
          ))}
      </g>
      </g>
    </svg>
  )
}
