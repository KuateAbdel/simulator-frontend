// src/pages/Onboarding.tsx
import React, { useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Area, AreaChart
} from 'recharts'
import { User, Building2, Landmark, Plus, CheckCircle, Circle, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, TabBar, StatusBadge, SegmentBadge, ScoreBar, ChartTooltip } from '../components/ui'
import { MOCK_CLIENTS, MOCK_LOANS, CHART_DATA } from '../data/mockData'

type ClientType = 'individual' | 'company' | 'institutional'

const ONBOARDING_STEPS = [
  { id: 1, label: 'Infos générales' },
  { id: 2, label: 'Documents KYC' },
  { id: 3, label: 'Évaluation risque' },
  { id: 4, label: 'Validation' },
]

export function Onboarding() {
  const { t, lang } = useApp()
  const [clientType, setClientType] = useState<ClientType>('individual')
  const [step, setStep] = useState(1)
  const [selectedClient, setSelectedClient] = useState(MOCK_CLIENTS[0])
  const [showForm, setShowForm] = useState(false)

  const clientLoan = MOCK_LOANS.find(l => l.clientId === selectedClient.id)

  const loanChartData = [
    { label: 'Jan', disbursed: 5000, outstanding: 5000 },
    { label: 'Feb', disbursed: 5000, outstanding: 4550 },
    { label: 'Mar', disbursed: 5000, outstanding: 4100 },
    { label: 'Apr', disbursed: 5000, outstanding: 3650 },
    { label: 'May', disbursed: 5000, outstanding: 3200 },
    { label: 'Jun', disbursed: 5000, outstanding: 2750 },
    { label: 'Jul', disbursed: 5000, outstanding: 2300 },
    { label: 'Aug', disbursed: 5000, outstanding: 1900 },
  ]

  const typeConfig = {
    individual: { icon: <User size={16} />, label: t('individual'), color: 'var(--primary)' },
    company: { icon: <Building2 size={16} />, label: t('company'), color: '#0ea5e9' },
    institutional: { icon: <Landmark size={16} />, label: t('institutional'), color: '#f59e0b' },
  }

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader
        title={t('nav_onboarding')}
        subtitle={t('onboarding')}
        action={
          <button className="btn-primary text-xs" style={{ height: 34 }} onClick={() => setShowForm(!showForm)}>
            <Plus size={13} /> {t('new_client')}
          </button>
        }
      />

      {/* New Client Form Modal */}
      {showForm && (
        <Card className="border-2" style={{ borderColor: 'var(--primary)' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('new_client')}</p>
            {/* Type selector */}
            <div className="flex gap-2">
              {Object.entries(typeConfig).map(([type, cfg]) => (
                <button
                  key={type}
                  onClick={() => setClientType(type as ClientType)}
                  className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all"
                  style={{
                    borderColor: clientType === type ? cfg.color : 'var(--border)',
                    background: clientType === type ? cfg.color + '15' : 'transparent',
                    color: clientType === type ? cfg.color : 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {cfg.icon} {cfg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stepper */}
          <div className="flex items-center justify-center gap-0 mb-6 flex-wrap">
            {ONBOARDING_STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div
                  className="flex flex-col items-center cursor-pointer"
                  onClick={() => setStep(s.id)}
                >
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mb-1 transition-all"
                    style={{
                      background: s.id < step ? 'var(--secondary)' : s.id === step ? 'var(--primary)' : 'var(--border)',
                      color: s.id <= step ? '#fff' : 'var(--text-muted)',
                    }}
                  >
                    {s.id < step ? <CheckCircle size={14} /> : s.id}
                  </div>
                  <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: s.id <= step ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                    {s.label}
                  </span>
                </div>
                {i < ONBOARDING_STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 mx-1 mb-4" style={{ background: step > s.id ? 'var(--secondary)' : 'var(--border)', minWidth: 24 }} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step Content */}
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[t('name'), t('gender'), t('age'), t('phone_number'), t('branch'), t('client_id')].map(label => (
                <div key={label}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input className="input-base" style={{ height: 34 }} placeholder={label} />
                </div>
              ))}
            </div>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              {['Pièce d\'identité', 'Justificatif de domicile', 'Contrat de travail', 'Photo'].map(doc => (
                <div key={doc} className="border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all hover:border-primary" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>📁 {doc}</p>
                  <p className="text-[10px] mt-1" style={{ color: 'var(--primary)' }}>{t('upload_photo')}</p>
                </div>
              ))}
            </div>
          )}
          {step === 3 && (
            <div className="grid grid-cols-2 gap-3">
              {[t('score'), t('segment'), t('segment_volatility'), t('loan_eligible')].map(label => (
                <div key={label}>
                  <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>{label}</label>
                  <input className="input-base" style={{ height: 34 }} placeholder={label} />
                </div>
              ))}
            </div>
          )}
          {step === 4 && (
            <div className="text-center py-4">
              <CheckCircle size={40} className="mx-auto mb-3" style={{ color: 'var(--secondary)' }} />
              <p className="font-display font-bold" style={{ color: 'var(--text-primary)' }}>Prêt à soumettre</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Vérifiez les informations avant validation.</p>
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            {step > 1 && <button className="btn-ghost text-xs" style={{ height: 32 }} onClick={() => setStep(s => s - 1)}>{t('back')}</button>}
            {step < 4
              ? <button className="btn-primary text-xs" style={{ height: 32 }} onClick={() => setStep(s => s + 1)}>{t('next')} <ChevronRight size={12} /></button>
              : <button className="btn-secondary text-xs" style={{ height: 32 }} onClick={() => { setShowForm(false); setStep(1) }}>{t('submit')}</button>
            }
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Client list */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
            <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('clients')}</p>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 440 }}>
            {MOCK_CLIENTS.map(client => (
              <div
                key={client.id}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: selectedClient.id === client.id ? 'var(--primary-light)' : '#fff',
                }}
                onClick={() => setSelectedClient(client)}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: 'var(--primary)', color: '#fff' }}
                >
                  {client.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{client.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{client.id} · {client.branch}</p>
                </div>
                <SegmentBadge segment={client.segment} />
              </div>
            ))}
          </div>
        </Card>

        {/* Client Profile */}
        <div className="lg:col-span-2 space-y-4">
          <Card style={{ padding: '16px' }}>
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, var(--primary), #a855f7)', fontSize: 14 }}
              >
                {selectedClient.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>{selectedClient.name}</h3>
                  <StatusBadge status={selectedClient.status} />
                  {selectedClient.loanEligible && <span className="badge-secondary">{t('loan_eligible')}</span>}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{selectedClient.id} · {selectedClient.branch}</p>
              </div>
              <SegmentBadge segment={selectedClient.segment} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: t('gender'), value: selectedClient.gender === 'F' ? t('female') : t('male') },
                { label: t('age'), value: `${selectedClient.age} ans` },
                { label: t('active_since'), value: selectedClient.activeSince },
                { label: t('phone_number'), value: selectedClient.phone },
                { label: t('branch'), value: selectedClient.branch },
                { label: t('category'), value: selectedClient.category },
                { label: t('operator'), value: selectedClient.operator },
                { label: t('score'), value: selectedClient.score },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl" style={{ background: 'var(--surface)' }}>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Loan details */}
          {clientLoan && (
            <Card style={{ padding: '16px' }}>
              <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{t('loans_profile')}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: t('loan_cycle'), value: `#${clientLoan.cycle}`, color: 'var(--primary)' },
                  { label: t('disbursed'), value: `$${clientLoan.amount.toLocaleString()}`, color: '#0ea5e9' },
                  { label: t('outstanding'), value: `$${clientLoan.outstanding.toLocaleString()}`, color: '#f59e0b' },
                  { label: t('installment'), value: `$${clientLoan.installment}/mois`, color: 'var(--secondary)' },
                ].map(item => (
                  <div key={item.label} className="text-center p-3 rounded-xl" style={{ background: item.color + '10', border: `1px solid ${item.color}30` }}>
                    <p className="font-display font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{item.label}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Progression remboursement</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--secondary)' }}>
                  {Math.round((1 - clientLoan.outstanding / clientLoan.amount) * 100)}%
                </span>
              </div>
              <div className="progress-bar mb-4">
                <div className="progress-fill progress-fill-green" style={{ width: `${(1 - clientLoan.outstanding / clientLoan.amount) * 100}%` }} />
              </div>
              <ResponsiveContainer width="100%" height={120}>
                <ComposedChart data={loanChartData} margin={{ left: -20, right: 0, top: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0ebff" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: '#a599be' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}K`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="disbursed" name="Décaissé" fill="#c68cff30" radius={[4, 4, 0, 0]} />
                  <Line type="monotone" dataKey="outstanding" name="Encours" stroke="#19af58" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
              <div className="flex items-center justify-between mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                <span>Décaissement: {clientLoan.disbursementDate}</span>
                <StatusBadge status={clientLoan.status} />
                <span>{t('maturity_date')}: {clientLoan.maturityDate}</span>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
