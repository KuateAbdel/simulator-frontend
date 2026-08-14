// src/pages/Bulk.tsx
import React, { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'
import { Zap, Users, DollarSign, TrendingUp, Download, Upload, CheckCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, TabBar, StatusBadge, ChartTooltip } from '../components/ui'
import { MOCK_CLIENTS, CHART_DATA } from '../data/mockData'

const BULK_DATA = [
  { id: 'BLK-001', name: 'Aminata Diallo', gender: 'F', age: 34, program: 'AgriSave', activeSince: '2022-01', disbursed: 1200, status: 'active', frequency: 'Mensuel' },
  { id: 'BLK-002', name: 'Moussa Koné', gender: 'M', age: 42, program: 'MicroBiz', activeSince: '2021-06', disbursed: 850, status: 'active', frequency: 'Hebdo' },
  { id: 'BLK-003', name: 'Fatou Mbaye', gender: 'F', age: 28, program: 'AgriSave', activeSince: '2023-01', disbursed: 2100, status: 'pending', frequency: 'Mensuel' },
  { id: 'BLK-004', name: 'Ibrahima Sow', gender: 'M', age: 55, program: 'WomenFund', activeSince: '2020-11', disbursed: 600, status: 'inactive', frequency: 'Mensuel' },
  { id: 'BLK-005', name: 'Rokhaya Ndiaye', gender: 'F', age: 31, program: 'MicroBiz', activeSince: '2022-09', disbursed: 1800, status: 'active', frequency: 'Bimensuel' },
  { id: 'BLK-006', name: 'Cheikh Faye', gender: 'M', age: 47, program: 'WomenFund', activeSince: '2019-04', disbursed: 950, status: 'active', frequency: 'Hebdo' },
]

const BULK_METRICS = [
  { month: 'Jan', collected: 18200, disbursed: 22400, pending: 3100 },
  { month: 'Fév', collected: 21300, disbursed: 19800, pending: 2800 },
  { month: 'Mar', collected: 19100, disbursed: 24600, pending: 3400 },
  { month: 'Avr', collected: 23500, disbursed: 21100, pending: 2200 },
  { month: 'Mai', collected: 26800, disbursed: 28400, pending: 1900 },
  { month: 'Jun', collected: 24200, disbursed: 25900, pending: 2600 },
]

export function Bulk() {
  const { t } = useApp()
  const [activeTab, setActiveTab] = useState('payment')
  const [selectedRows, setSelectedRows] = useState<string[]>([])

  const toggleRow = (id: string) => {
    setSelectedRows(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id])
  }

  const toggleAll = () => {
    setSelectedRows(selectedRows.length === BULK_DATA.length ? [] : BULK_DATA.map(r => r.id))
  }

  const tabs = [
    { id: 'payment', label: t('bulk_payment') },
    { id: 'metrics', label: t('metrics') },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title={t('nav_bulk')}
        subtitle="Gestion des paiements collectifs"
        action={
          <div className="flex gap-2">
            <button className="btn-ghost text-xs" style={{ height: 34 }}>
              <Upload size={13} /> {t('import')}
            </button>
            <button className="btn-primary text-xs" style={{ height: 34 }}>
              <Download size={13} /> {t('export')}
            </button>
          </div>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 stagger">
        {[
          { label: 'Programmes actifs', value: 3, sub: 'programmes', color: 'var(--primary)', icon: <Zap size={15} /> },
          { label: 'Participants', value: '486', sub: 'bénéficiaires', color: '#0ea5e9', icon: <Users size={15} /> },
          { label: 'Collecté ce mois', value: '$24.2K', sub: '+8.2% vs mois dernier', color: 'var(--secondary)', icon: <TrendingUp size={15} /> },
          { label: 'Décaissé ce mois', value: '$25.9K', sub: '6 transactions', color: '#f59e0b', icon: <DollarSign size={15} /> },
        ].map(kpi => (
          <div key={kpi.label} className="card p-4" style={{ borderTop: `3px solid ${kpi.color}` }}>
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: kpi.color + '15', color: kpi.color }}>{kpi.icon}</div>
            </div>
            <p className="font-display font-bold text-xl" style={{ color: 'var(--text-primary)' }}>{kpi.value}</p>
            <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{kpi.label}</p>
            <p className="text-[10px] mt-0.5" style={{ color: kpi.color }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'payment' && (
        <div className="space-y-4">
          {/* Bulk action bar */}
          {selectedRows.length > 0 && (
            <div
              className="flex items-center justify-between px-4 py-2.5 rounded-xl animate-fade-in"
              style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)' }}
            >
              <span className="text-xs font-semibold" style={{ color: 'var(--primary-dark)' }}>
                <CheckCircle size={12} className="inline mr-1" />{selectedRows.length} sélectionné(s)
              </span>
              <div className="flex gap-2">
                <button className="btn-primary text-xs" style={{ height: 28 }}>Valider paiements</button>
                <button className="btn-ghost text-xs" style={{ height: 28 }} onClick={() => setSelectedRows([])}>Annuler</button>
              </div>
            </div>
          )}

          {/* Table */}
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 36 }}>
                      <input type="checkbox" checked={selectedRows.length === BULK_DATA.length} onChange={toggleAll} style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                    </th>
                    <th>ID</th>
                    <th>{t('name')}</th>
                    <th>{t('gender')}</th>
                    <th>{t('age')}</th>
                    <th>{t('program')}</th>
                    <th>{t('active_since')}</th>
                    <th>{t('disbursed')}</th>
                    <th>{t('frequency')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {BULK_DATA.map(row => (
                    <tr key={row.id}>
                      <td>
                        <input type="checkbox" checked={selectedRows.includes(row.id)} onChange={() => toggleRow(row.id)} style={{ cursor: 'pointer', accentColor: 'var(--primary)' }} />
                      </td>
                      <td><span className="font-mono text-xs" style={{ color: 'var(--primary-dark)' }}>{row.id}</span></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0" style={{ background: 'var(--primary)' }}>
                            {row.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                          </div>
                          <span className="text-xs font-medium">{row.name}</span>
                        </div>
                      </td>
                      <td><span className="text-xs">{row.gender === 'F' ? '♀ F' : '♂ M'}</span></td>
                      <td><span className="text-xs">{row.age}</span></td>
                      <td>
                        <span className="badge-primary text-[10px]">{row.program}</span>
                      </td>
                      <td><span className="text-xs font-mono">{row.activeSince}</span></td>
                      <td><span className="text-xs font-mono font-semibold" style={{ color: 'var(--secondary)' }}>${row.disbursed.toLocaleString()}</span></td>
                      <td><span className="text-xs">{row.frequency}</span></td>
                      <td><StatusBadge status={row.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Mini graph */}
          <Card style={{ padding: '16px' }}>
            <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Flux collectifs – 6 mois</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={BULK_METRICS} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#a599be' }} />
                <Bar dataKey="collected" name="Collecté" fill="#19af58" radius={[4, 4, 0, 0]} />
                <Bar dataKey="disbursed" name="Décaissé" fill="#c68cff" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pending" name="En attente" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card style={{ padding: '16px' }}>
            <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Tendance collecte</p>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={BULK_METRICS} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v / 1000}K`} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="collected" name="Collecté" stroke="#19af58" strokeWidth={2.5} dot={{ r: 3, fill: '#19af58' }} />
                <Line type="monotone" dataKey="disbursed" name="Décaissé" stroke="#c68cff" strokeWidth={2.5} dot={{ r: 3, fill: '#c68cff' }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card style={{ padding: '16px' }}>
            <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Répartition par programme</p>
            <div className="space-y-3 mt-2">
              {[
                { name: 'AgriSave', pct: 38, count: 185, color: '#19af58' },
                { name: 'MicroBiz', pct: 29, count: 141, color: '#c68cff' },
                { name: 'WomenFund', pct: 21, count: 102, color: '#0ea5e9' },
                { name: 'Autres', pct: 12, count: 58, color: '#fbbf24' },
              ].map(prog => (
                <div key={prog.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{prog.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{prog.count} bénéficiaires · {prog.pct}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${prog.pct}%`, background: prog.color }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
