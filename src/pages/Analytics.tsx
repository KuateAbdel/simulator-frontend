// src/pages/Analytics.tsx
import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine
} from 'recharts'
import { TrendingUp, TrendingDown, AlertTriangle, BarChart3 } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, ChartTooltip } from '../components/ui'
import { CHART_DATA, PAR_DATA } from '../data/mockData'

const VOLATILITY_DATA = [
  { month: 'Jan', low: 62, medium: 28, high: 10 },
  { month: 'Fév', low: 58, medium: 31, high: 11 },
  { month: 'Mar', low: 65, medium: 26, high: 9 },
  { month: 'Avr', low: 60, medium: 30, high: 10 },
  { month: 'Mai', low: 67, medium: 24, high: 9 },
  { month: 'Jun', low: 70, medium: 22, high: 8 },
]

const RADAR_DATA = [
  { metric: 'Remboursement', value: 87 },
  { metric: 'Collecte', value: 74 },
  { metric: 'Décaissement', value: 91 },
  { metric: 'Défauts', value: 62 },
  { metric: 'PAR 0', value: 85 },
  { metric: 'Score', value: 78 },
]

const EXPOSURE_DATA = [
  { segment: 'S1', exposure: 42000, defaultRate: 18.2 },
  { segment: 'S2', exposure: 128000, defaultRate: 11.4 },
  { segment: 'S3', exposure: 348000, defaultRate: 6.8 },
  { segment: 'S4', exposure: 521000, defaultRate: 3.2 },
  { segment: 'S5', exposure: 267000, defaultRate: 0.9 },
]

export function Analytics() {
  const { t } = useApp()

  const kpis = [
    { label: 'Exposition totale', value: '$1.31M', change: '+4.2%', up: true, color: 'var(--primary)' },
    { label: 'Taux de défaut', value: '3.1%', change: '-0.4%', up: false, color: '#ef4444' },
    { label: 'PAR 0 couverture', value: '68.2%', change: '+1.8%', up: true, color: 'var(--secondary)' },
    { label: 'Cycle moyen prêt', value: '2.3', change: '0.0%', up: true, color: '#f59e0b' },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader title={t('nav_analytics')} subtitle="Analyse de risque, exposition et performance du portefeuille" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {kpis.map(kpi => (
          <div key={kpi.label} className="card p-4" style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
              <span className={`flex items-center gap-0.5 text-xs font-semibold ${kpi.up ? 'stat-up' : 'stat-down'}`}>
                {kpi.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />} {kpi.change}
              </span>
            </div>
            <p className="font-display font-bold text-2xl" style={{ color: kpi.color }}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Row 1: PAR + Exposure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* PAR Analysis */}
        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            PAR 0 · 60 · 90 — Distribution
          </p>
          <div className="space-y-3 mb-4">
            {PAR_DATA.map(par => {
              const color = par.label === 'PAR 0' ? 'var(--secondary)' : par.label === 'PAR 60' ? '#f59e0b' : par.label === 'PAR 90' ? '#f97316' : '#ef4444'
              return (
                <div key={par.label} className="p-3 rounded-xl" style={{ background: color + '0d', border: `1px solid ${color}25` }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold" style={{ color }}>{par.label}</span>
                    <div className="flex items-center gap-3 text-xs">
                      <span style={{ color: 'var(--text-muted)' }}>{par.count} prêts</span>
                      <span className="font-mono font-semibold" style={{ color }}>${(par.amount / 1000).toFixed(0)}K</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${par.pct}%`, background: color }} />
                  </div>
                  <p className="text-right text-[10px] mt-1 font-mono" style={{ color }}>{par.pct}%</p>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Exposure by segment */}
        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Exposition & Taux de défaut par segment
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={EXPOSURE_DATA} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="segment" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#a599be' }} />
              <Bar yAxisId="left" dataKey="exposure" name="Exposition ($)" fill="#c68cff" radius={[4, 4, 0, 0]} />
              <Line yAxisId="right" type="monotone" dataKey="defaultRate" name="Défaut (%)" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444' }} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2: Volatility + Radar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Volatility stack */}
        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Volatilité du portefeuille — 6 mois
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={VOLATILITY_DATA} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="low" name="Basse" stackId="a" fill="#19af58" />
              <Bar dataKey="medium" name="Moyenne" stackId="a" fill="#fbbf24" />
              <Bar dataKey="high" name="Haute" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Radar chart */}
        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-2" style={{ color: 'var(--text-primary)' }}>
            Score multidimensionnel
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={RADAR_DATA} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
              <PolarGrid stroke="#e9d5ff" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 9, fill: '#a599be' }} />
              <Radar name="Performance" dataKey="value" stroke="#c68cff" fill="#c68cff" fillOpacity={0.25} strokeWidth={2} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: Loan cycle + defaults timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Évolution décaissement & encours
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHART_DATA} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="gradD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c68cff" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#c68cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradO" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19af58" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#19af58" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="disbursed" name="Décaissé" stroke="#c68cff" fill="url(#gradD)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="outstanding" name="Encours" stroke="#19af58" fill="url(#gradO)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: '16px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>
            Défauts & Collecte — Tendance
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={CHART_DATA} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={3000} stroke="#fbbf24" strokeDasharray="4 2" label={{ value: 'Seuil', fontSize: 9, fill: '#fbbf24' }} />
              <Line type="monotone" dataKey="collected" name="Collecté" stroke="#19af58" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="defaults" name="Défauts" stroke="#ef4444" strokeWidth={2} strokeDasharray="4 2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
