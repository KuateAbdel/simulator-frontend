// src/pages/Lender.tsx
import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { Banknote, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, TabBar, StatusBadge, ChartTooltip } from '../components/ui'
import { MOCK_LENDER_PROGRAMS } from '../data/mockData'

const CASHFLOW_DATA = [
  { month: 'Jan', disbursed: 85000, outstanding: 220000, collected: 42000, defaults: 3200 },
  { month: 'Fév', disbursed: 92000, outstanding: 241000, collected: 51000, defaults: 2800 },
  { month: 'Mar', disbursed: 78000, outstanding: 255000, collected: 58000, defaults: 3100 },
  { month: 'Avr', disbursed: 104000, outstanding: 271000, collected: 64000, defaults: 2400 },
  { month: 'Mai', disbursed: 118000, outstanding: 290000, collected: 72000, defaults: 2100 },
  { month: 'Jun', disbursed: 96000, outstanding: 304000, collected: 78000, defaults: 1900 },
]

const BENEFICIARIES = [
  { id: 'BNF-001', name: 'COOPEC Dakar', type: 'Coopérative', participants: 145, received: 185000, status: 'active' },
  { id: 'BNF-002', name: 'MFI Thiès', type: 'Microfinance', participants: 98, received: 142000, status: 'active' },
  { id: 'BNF-003', name: 'Assoc. Femmes', type: 'ONG', participants: 64, received: 87000, status: 'active' },
  { id: 'BNF-004', name: 'Agri-Coop', type: 'Agriculture', participants: 201, received: 310000, status: 'pending' },
]

export function Lender() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState('programs')
  const [selectedProgram, setSelectedProgram] = useState(MOCK_LENDER_PROGRAMS[0])

  const tabs = [
    { id: 'programs', label: t('programs') },
    { id: 'beneficiary', label: t('beneficiary') },
  ]

  const volatilityColor = (v: string) => v === 'low' ? 'var(--secondary)' : v === 'medium' ? '#f59e0b' : '#ef4444'

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader title={t('nav_lender')} subtitle="Programmes de financement et bénéficiaires" />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Programmes actifs', value: '3', color: 'var(--primary)', icon: <Banknote size={15} /> },
          { label: 'Total bénéficiaires', value: '487', color: '#0ea5e9', icon: <Users size={15} /> },
          { label: 'Total décaissé', value: '$2.12M', color: 'var(--secondary)', icon: <TrendingUp size={15} /> },
          { label: 'Encours total', value: '$1.42M', color: '#f59e0b', icon: <AlertTriangle size={15} /> },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4" style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: kpi.color + '15', color: kpi.color }}>{kpi.icon}</div>
            </div>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
          </div>
        ))}
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Program list */}
          <div className="space-y-3">
            {MOCK_LENDER_PROGRAMS.map(prog => (
              <div
                key={prog.id}
                className="card p-4 cursor-pointer"
                style={{
                  borderLeft: `3px solid ${selectedProgram.id === prog.id ? 'var(--primary)' : 'var(--border)'}`,
                  background: selectedProgram.id === prog.id ? 'var(--primary-light)' : '#fff',
                }}
                onClick={() => setSelectedProgram(prog)}
              >
                <div className="flex items-start justify-between mb-2">
                  <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{prog.name}</p>
                  <StatusBadge status={prog.status} />
                </div>
                <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{prog.productType}</p>
                <div className="flex justify-between text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>{prog.participants} participants</span>
                  <span className="font-semibold font-mono" style={{ color: 'var(--secondary)' }}>
                    ${(prog.disbursed / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="progress-bar mt-2">
                  <div className="progress-fill" style={{ width: `${(prog.outstanding / prog.disbursed) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>

          {/* Program detail */}
          <div className="lg:col-span-2 space-y-4">
            <Card style={{ padding: '16px' }}>
              <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
                <div>
                  <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>{selectedProgram.name}</h3>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedProgram.productType} · Actif depuis {selectedProgram.activeSince}</p>
                </div>
                <StatusBadge status={selectedProgram.status} />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('participants'), value: selectedProgram.participants, color: 'var(--primary)' },
                  { label: t('disbursed'), value: `$${(selectedProgram.disbursed / 1000).toFixed(0)}K`, color: '#0ea5e9' },
                  { label: t('outstanding'), value: `$${(selectedProgram.outstanding / 1000).toFixed(0)}K`, color: '#f59e0b' },
                  { label: 'Segment', value: `S${selectedProgram.segment}`, color: 'var(--secondary)' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: item.color + '10' }}>
                    <p className="font-display font-bold text-base" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Volatilité:</span>
                <span className="text-xs font-semibold" style={{ color: volatilityColor(selectedProgram.volatility) }}>
                  ● {selectedProgram.volatility === 'low' ? 'Basse' : selectedProgram.volatility === 'medium' ? 'Moyenne' : 'Haute'}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Échéance: {selectedProgram.maturityDate}</span>
              </div>
            </Card>

            {/* Cashflow chart */}
            <Card style={{ padding: '16px' }}>
              <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Flux de trésorerie — 6 mois</p>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={CASHFLOW_DATA} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 10, color: '#a599be' }} />
                  <Bar dataKey="disbursed" name="Décaissé" fill="#c68cff80" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collecté" fill="#19af5880" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="outstanding" name="Encours" stroke="#0ea5e9" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="defaults" name="Défauts" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="4 2" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'beneficiary' && (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('beneficiary')}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>{t('name')}</th>
                  <th>Type</th>
                  <th>{t('participants')}</th>
                  <th>Reçu</th>
                  <th>{t('status')}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {BENEFICIARIES.map(bnf => (
                  <tr key={bnf.id}>
                    <td><span className="font-mono text-xs" style={{ color: 'var(--primary-dark)' }}>{bnf.id}</span></td>
                    <td><span className="text-xs font-semibold">{bnf.name}</span></td>
                    <td><span className="badge-primary text-[10px]">{bnf.type}</span></td>
                    <td><span className="text-xs">{bnf.participants}</span></td>
                    <td><span className="text-xs font-mono font-semibold" style={{ color: 'var(--secondary)' }}>${bnf.received.toLocaleString()}</span></td>
                    <td><StatusBadge status={bnf.status} /></td>
                    <td>
                      <button className="btn-ghost text-xs px-2" style={{ height: 26 }}>
                        {t('view_details')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
