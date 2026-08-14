// src/pages/Overview.tsx
import React from 'react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  Users, DollarSign, TrendingUp, AlertCircle, Zap, Banknote,
  CreditCard, ArrowUpRight, ChevronRight, Gift
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { StatCard, SectionHeader, ChartTooltip, Card, SegmentBadge } from '../components/ui'
import { CHART_DATA, SEGMENT_DISTRIBUTION, PAR_DATA, MOCK_CLIENTS } from '../data/mockData'

export function Overview() {
  const { t, setCurrentPage, setSelectedClientId } = useApp()

  const kpis = [
    { title: t('total_collect'), nbClients: 1248, faceValue: 3420000, changePct: 8.4, icon: <Users size={16} />, color: 'var(--primary)' },
    { title: t('total_bulk'), nbClients: 486, faceValue: 1250000, changePct: 12.1, icon: <Zap size={16} />, color: '#8b5cf6' },
    { title: t('total_lender'), nbClients: 38, faceValue: 2100000, changePct: -2.3, icon: <Banknote size={16} />, color: '#0ea5e9' },
    { title: t('total_accounts'), nbClients: 3412, faceValue: 5890000, changePct: 5.7, icon: <CreditCard size={16} />, color: '#f59e0b' },
    { title: t('total_active'), nbClients: 2890, faceValue: 4200000, changePct: 3.2, icon: <TrendingUp size={16} />, color: 'var(--secondary)' },
    { title: t('total_outstanding'), nbClients: 460, faceValue: 1306000, changePct: -1.8, icon: <DollarSign size={16} />, color: '#ef4444' },
  ]

  const activeOffers = [
    { clientId: 'CLI-003', name: 'Fatou Mbaye', amount: 8000 },
    { clientId: 'CLI-007', name: 'Mariama Balde', amount: 5000 },
    { clientId: 'CLI-008', name: 'Ousmane Diop', amount: 12000 },
  ]

  return (
    <div className="animate-fade-in space-y-6">
      {/* KPI Cards */}
      <div>
        <SectionHeader title={t('nav_overview')} subtitle={`${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`} />
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 stagger">
          {kpis.map(kpi => (
            <StatCard key={kpi.title} {...kpi} clientLabel={t('clients')} />
          ))}
        </div>
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Disbursed area chart */}
        <Card className="lg:col-span-2" style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('disbursed_month')}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Portefeuille 12 mois</p>
            </div>
            <span className="badge-primary">2024</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={CHART_DATA} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradDisbursed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c68cff" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#c68cff" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradOutstanding" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#19af58" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#19af58" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="disbursed" name="Décaissé" stroke="#c68cff" strokeWidth={2} fill="url(#gradDisbursed)" dot={false} />
              <Area type="monotone" dataKey="outstanding" name="Encours" stroke="#19af58" strokeWidth={2} fill="url(#gradOutstanding)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Customer Score Donut */}
        <Card style={{ padding: '18px' }}>
          <p className="font-display font-semibold text-sm mb-1" style={{ color: 'var(--text-primary)' }}>{t('customer_score')}</p>
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>Segments 1–5</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={SEGMENT_DISTRIBUTION} cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3} dataKey="value">
                {SEGMENT_DISTRIBUTION.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 justify-center">
            {SEGMENT_DISTRIBUTION.map(s => (
              <span key={s.name} className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                {s.name.replace('Segment ', 'S')} {s.value}%
              </span>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 3: Portfolio risk + Payments + Offers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Portfolio risk */}
        <Card style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('portfolio_risk')}</p>
            <button
              className="text-xs flex items-center gap-1"
              style={{ color: 'var(--primary-dark)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
              onClick={() => setCurrentPage('analytics')}
            >
              {t('see_analytics')} <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {PAR_DATA.map(par => (
              <div key={par.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{par.label}</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    {par.count} loans · ${(par.amount / 1000).toFixed(0)}K
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="progress-bar flex-1">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${par.pct}%`,
                        background: par.label === 'PAR 0' ? '#19af58'
                          : par.label === 'PAR 60' ? '#f59e0b'
                          : par.label === 'PAR 90' ? '#f97316'
                          : '#ef4444'
                      }}
                    />
                  </div>
                  <span className="text-[10px] font-mono font-semibold w-8 text-right" style={{ color: 'var(--text-muted)' }}>{par.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Payments */}
        <Card style={{ padding: '18px' }}>
          <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{t('payments')}</p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#fee2e220' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: '#b91c1c' }}>{t('overdue')}</p>
                <p className="font-display font-bold text-2xl" style={{ color: '#ef4444' }}>145</p>
              </div>
              <AlertCircle size={28} style={{ color: '#ef4444', opacity: 0.5 }} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--secondary-light)' }}>
              <div>
                <p className="text-xs font-semibold" style={{ color: 'var(--secondary-dark)' }}>{t('expected')}</p>
                <p className="font-display font-bold text-2xl" style={{ color: 'var(--secondary)' }}>412</p>
              </div>
              <ArrowUpRight size={28} style={{ color: 'var(--secondary)', opacity: 0.5 }} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={80} className="mt-3">
            <BarChart data={CHART_DATA.slice(-6)} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
              <Bar dataKey="collected" fill="#19af58" radius={[4, 4, 0, 0]} />
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Active Offers */}
        <Card style={{ padding: '18px' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('active_offers')}</p>
            <span className="badge-primary">{activeOffers.length} {t('to_propose')}</span>
          </div>
          <div className="space-y-2">
            {activeOffers.map(offer => (
              <div
                key={offer.clientId}
                className="flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                onClick={() => { setSelectedClientId(offer.clientId); setCurrentPage('clients') }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                    <Gift size={12} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{offer.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{offer.clientId}</p>
                  </div>
                </div>
                <span className="font-mono text-xs font-bold" style={{ color: 'var(--secondary)' }}>
                  ${offer.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
          <button className="btn-secondary w-full mt-3 justify-center text-xs" style={{ height: 32 }}>
            {t('new_offer')} <ArrowUpRight size={12} />
          </button>
        </Card>
      </div>
    </div>
  )
}
