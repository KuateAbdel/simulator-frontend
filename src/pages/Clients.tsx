// src/pages/Clients.tsx
import React, { useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { Search, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, TabBar, StatusBadge, SegmentBadge, ScoreBar, ChartTooltip } from '../components/ui'
import { MOCK_CLIENTS, MOCK_LOANS, MOCK_TRANSACTIONS } from '../data/mockData'

const CASHFLOW_DATA = [
  { date: '01 Apr', cashIn: 1200, cashOut: 500 },
  { date: '05 Apr', cashIn: 0, cashOut: 800 },
  { date: '08 Apr', cashIn: 3500, cashOut: 0 },
  { date: '10 Apr', cashIn: 450, cashOut: 250 },
  { date: '12 Apr', cashIn: 0, cashOut: 1100 },
  { date: '15 Apr', cashIn: 2200, cashOut: 0 },
  { date: '18 Apr', cashIn: 800, cashOut: 600 },
]

export function Clients() {
  const { t, selectedClientId, setSelectedClientId } = useApp()
  const [activeTab, setActiveTab] = useState('banking')
  const [search, setSearch] = useState('')

  const filteredClients = MOCK_CLIENTS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase())
  )

  const selected = MOCK_CLIENTS.find(c => c.id === (selectedClientId || MOCK_CLIENTS[0].id)) || MOCK_CLIENTS[0]
  const clientLoan = MOCK_LOANS.find(l => l.clientId === selected.id)
  const clientTxns = MOCK_TRANSACTIONS.filter(t => t.clientId === selected.id)

  const tabs = [
    { id: 'banking', label: t('banking_profile') },
    { id: 'loans', label: t('loans_profile') },
    { id: 'metrics', label: t('metrics') },
    { id: 'analytics', label: t('analytics') },
  ]

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader title={t('nav_clients')} subtitle="Gestion et analyse des clients" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Client list sidebar */}
        <Card style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div className="p-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input
                className="input-base"
                style={{ paddingLeft: 28, height: 32, fontSize: '0.75rem' }}
                placeholder={t('search') + '...'}
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-y-auto flex-1" style={{ maxHeight: 520 }}>
            {filteredClients.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selected.id === client.id ? 'var(--primary-light)' : '#fff',
                }}
                onClick={() => setSelectedClientId(client.id)}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
                  style={{ background: client.segment >= 4 ? 'var(--secondary)' : 'var(--primary)' }}
                >
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{client.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{client.id}</p>
                </div>
                <StatusBadge status={client.status} />
              </div>
            ))}
          </div>
        </Card>

        {/* Main content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Client header */}
          <Card style={{ padding: '14px 16px' }}>
            <div className="flex items-center gap-3 flex-wrap">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary), #a855f7)', fontSize: 13 }}
              >
                {selected.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold" style={{ color: 'var(--text-primary)', fontSize: 15 }}>{selected.name}</h3>
                  <StatusBadge status={selected.status} />
                  <SegmentBadge segment={selected.segment} />
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {selected.id} · {selected.branch} · {selected.phone}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Score</span>
                <div style={{ width: 80 }}>
                  <ScoreBar score={selected.score} />
                </div>
              </div>
            </div>
          </Card>

          <TabBar tabs={tabs} active={activeTab} onChange={setActiveTab} />

          {/* Banking Profile */}
          {activeTab === 'banking' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: t('gender'), value: selected.gender === 'F' ? 'Femme ♀' : 'Homme ♂' },
                  { label: t('age'), value: `${selected.age} ans` },
                  { label: t('active_since'), value: selected.activeSince },
                  { label: t('category'), value: selected.category },
                  { label: t('operator'), value: selected.operator },
                  { label: t('branch'), value: selected.branch },
                ].map(item => (
                  <div key={item.label} className="card p-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Transaction table */}
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                  <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Transactions récentes</p>
                  <span className="badge-primary">{clientTxns.length} transactions</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>{t('date')}</th>
                        <th>{t('transaction_id')}</th>
                        <th>{t('description')}</th>
                        <th>{t('cash_in')}</th>
                        <th>{t('cash_out')}</th>
                        <th>{t('status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientTxns.length > 0 ? clientTxns.map(txn => (
                        <tr key={txn.id}>
                          <td><span className="font-mono text-xs">{txn.date}</span></td>
                          <td><span className="font-mono text-xs" style={{ color: 'var(--primary-dark)' }}>{txn.id}</span></td>
                          <td><span className="text-xs">{txn.description}</span></td>
                          <td>
                            {txn.cashIn > 0
                              ? <span className="text-xs font-semibold font-mono stat-up">+${txn.cashIn}</span>
                              : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td>
                            {txn.cashOut > 0
                              ? <span className="text-xs font-semibold font-mono stat-down">-${txn.cashOut}</span>
                              : <span className="text-xs text-gray-300">—</span>}
                          </td>
                          <td><StatusBadge status={txn.status} /></td>
                        </tr>
                      )) : (
                        <tr><td colSpan={6} className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>{t('no_data')}</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Cashflow chart */}
              <Card style={{ padding: '16px' }}>
                <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Flux de trésorerie – Avril</p>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={CASHFLOW_DATA} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="cashIn" name="Entrée" fill="#19af58" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cashOut" name="Sortie" fill="#c68cff" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* Loans Profile */}
          {activeTab === 'loans' && (
            <div className="space-y-4">
              {clientLoan ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: t('name'), value: selected.name, color: 'var(--primary)' },
                      { label: t('active_since'), value: selected.activeSince, color: '#0ea5e9' },
                      { label: t('loan_cycle'), value: `Cycle #${clientLoan.cycle}`, color: '#f59e0b' },
                      { label: t('loan_eligible'), value: selected.loanEligible ? '✓ Oui' : '✗ Non', color: selected.loanEligible ? 'var(--secondary)' : '#ef4444' },
                    ].map(item => (
                      <div key={item.label} className="card p-3" style={{ borderLeft: `3px solid ${item.color}` }}>
                        <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                        <p className="text-sm font-semibold" style={{ color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Loan bar */}
                  <Card style={{ padding: '16px' }}>
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Prêt {clientLoan.id}</p>
                      <StatusBadge status={clientLoan.status} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {[
                        { label: t('disbursed'), value: `$${clientLoan.amount.toLocaleString()}`, color: '#0ea5e9' },
                        { label: t('outstanding'), value: `$${clientLoan.outstanding.toLocaleString()}`, color: '#f59e0b' },
                        { label: t('installment'), value: `$${clientLoan.installment}/mo`, color: 'var(--secondary)' },
                      ].map(item => (
                        <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: item.color + '10' }}>
                          <p className="font-display font-bold text-base" style={{ color: item.color }}>{item.value}</p>
                          <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: 'var(--text-muted)' }}>Remboursé</span>
                      <span className="font-semibold stat-up">{Math.round((1 - clientLoan.outstanding / clientLoan.amount) * 100)}%</span>
                    </div>
                    <div className="progress-bar mb-2">
                      <div className="progress-fill progress-fill-green" style={{ width: `${(1 - clientLoan.outstanding / clientLoan.amount) * 100}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      <span>Décaissé: {clientLoan.disbursementDate}</span>
                      <span>Échéance: {clientLoan.maturityDate}</span>
                    </div>
                  </Card>
                </>
              ) : (
                <Card>
                  <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Aucun prêt actif pour ce client.</p>
                </Card>
              )}
            </div>
          )}

          {/* Metrics */}
          {activeTab === 'metrics' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card style={{ padding: '16px' }}>
                <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Historique de remboursements</p>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={CASHFLOW_DATA} margin={{ left: -20, right: 0, top: 4, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradCI" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#19af58" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#19af58" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="cashIn" name="Entrée" stroke="#19af58" strokeWidth={2} fill="url(#gradCI)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              <Card style={{ padding: '16px' }}>
                <p className="font-display font-semibold text-sm mb-3" style={{ color: 'var(--text-primary)' }}>Indicateurs</p>
                <div className="space-y-3">
                  {[
                    { label: 'Taux de remboursement', value: 96.4, color: 'var(--secondary)' },
                    { label: 'Engagement programme', value: 78, color: 'var(--primary)' },
                    { label: 'Risque volatilité', value: 32, color: '#f59e0b' },
                    { label: 'Utilisation limite crédit', value: 58, color: '#0ea5e9' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                        <span className="font-semibold font-mono" style={{ color: item.color }}>{item.value}%</span>
                      </div>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${item.value}%`, background: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'analytics' && (
            <Card style={{ padding: '16px' }}>
              <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>Analytique client — {selected.name}</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={CASHFLOW_DATA} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="cashIn" name="Entrée" fill="#19af58" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="cashOut" name="Sortie" fill="#f87171" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
