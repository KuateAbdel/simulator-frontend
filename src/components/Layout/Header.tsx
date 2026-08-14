// src/components/Layout/Header.tsx
import React, { useState } from 'react'
import {
  Bell, Search, Globe, QrCode, Key, ChevronDown, X,
  Clock, User, AlertTriangle, CheckCircle, Info, Filter
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

export function Header() {
  const { t, lang, setLang, staff, alerts, markAlertRead, sessionSeconds, currentPage } = useApp()

  const [showAlerts, setShowAlerts] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const { filters, setFilters, resetFilters } = useApp()

  const unreadCount = alerts.filter(a => !a.read).length

  const alertIcon = (type: string) => {
    if (type === 'danger') return <AlertTriangle size={14} className="text-red-500" />
    if (type === 'warning') return <AlertTriangle size={14} className="text-amber-500" />
    if (type === 'success') return <CheckCircle size={14} className="text-green-500" />
    return <Info size={14} className="text-blue-400" />
  }

  const pageTitle: Record<string, string> = {
    overview: t('nav_overview'),
    onboarding: t('nav_onboarding'),
    bulk: t('nav_bulk'),
    clients: t('nav_clients'),
    lender: t('nav_lender'),
    analytics: t('nav_analytics'),
    backoffice: t('nav_backoffice'),
  }

  return (
    <header
      className="flex items-center justify-between px-5 py-3 border-b"
      style={{
        background: '#fff',
        borderColor: 'var(--border)',
        position: 'sticky', top: 0, zIndex: 40,
        boxShadow: '0 1px 8px rgba(198,140,255,0.07)',
        minHeight: 56,
      }}
    >
      {/* Left — Page title + Search */}
      <div className="flex items-center gap-4">
        <h1 className="font-display font-bold text-base" style={{ color: 'var(--text-primary)' }}>
          {pageTitle[currentPage]}
        </h1>
        <div className="relative hidden md:block">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            className="input-base text-xs pl-8"
            style={{ width: 200, height: 32, padding: '0 10px 0 30px' }}
            placeholder={t('search') + '...'}
          />
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">

        {/* Session timer */}
        <span className="session-timer hidden sm:flex items-center gap-1.5">
          <Clock size={11} />
          {formatTime(sessionSeconds)}
        </span>

        {/* Filter toggle */}
        <button
          className="btn-ghost text-xs px-3"
          style={{ height: 32 }}
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={13} /> {t('filters')}
        </button>

        {/* Language switcher */}
        <button
          className="flex items-center gap-1 text-xs font-medium rounded-lg px-2 py-1 border transition-all"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            cursor: 'pointer',
          }}
          onClick={() => setLang(lang === 'fr' ? 'en' : 'fr')}
          title="Switch language"
        >
          <Globe size={13} />
          {lang.toUpperCase()}
        </button>

        {/* QR Code */}
        <button
          className="btn-ghost text-xs px-2"
          style={{ height: 32 }}
          onClick={() => setShowQR(true)}
          title={t('qr_code')}
        >
          <QrCode size={14} />
        </button>

        {/* Reset password */}
        <button
          className="btn-ghost text-xs px-2"
          style={{ height: 32 }}
          title={t('reset_password')}
        >
          <Key size={14} />
        </button>

        {/* Alerts bell */}
        <div className="relative">
          <button
            className="relative flex items-center justify-center rounded-lg border transition-all"
            style={{
              width: 32, height: 32,
              borderColor: 'var(--border)',
              background: unreadCount > 0 ? 'var(--primary-light)' : 'transparent',
              color: unreadCount > 0 ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
            }}
            onClick={() => { setShowAlerts(!showAlerts); setShowProfile(false) }}
          >
            <Bell size={14} />
            {unreadCount > 0 && (
              <span
                className="absolute -top-1 -right-1 rounded-full text-white font-bold"
                style={{ fontSize: 9, minWidth: 16, height: 16, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px' }}
              >
                {unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              className="absolute right-0 mt-2 rounded-xl border overflow-hidden animate-fade-in"
              style={{ width: 300, background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)', zIndex: 100 }}
            >
              <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('alerts')}</span>
                <button onClick={() => setShowAlerts(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)', background: 'none', border: 'none' }}>
                  <X size={14} />
                </button>
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 280 }}>
                {alerts.map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-all"
                    style={{ background: alert.read ? '#fff' : 'var(--primary-light)', borderBottom: '1px solid var(--border)' }}
                    onClick={() => markAlertRead(alert.id)}
                  >
                    <span className="mt-0.5 flex-shrink-0">{alertIcon(alert.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-snug" style={{ color: 'var(--text-primary)' }}>{alert.message}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{alert.time}</p>
                    </div>
                    {!alert.read && (
                      <span className="w-2 h-2 rounded-full flex-shrink-0 mt-1" style={{ background: 'var(--primary)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div className="relative">
          <button
            className="flex items-center gap-2 rounded-xl border px-2 py-1 transition-all"
            style={{
              borderColor: 'var(--border)',
              background: showProfile ? 'var(--surface)' : 'transparent',
              cursor: 'pointer',
              height: 32,
            }}
            onClick={() => { setShowProfile(!showProfile); setShowAlerts(false) }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              SR
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold leading-none" style={{ color: 'var(--text-primary)' }}>Sophie R.</p>
              <p className="text-[10px] leading-none mt-0.5" style={{ color: 'var(--text-muted)' }}>Portfolio Mgr</p>
            </div>
            <ChevronDown size={11} style={{ color: 'var(--text-muted)' }} />
          </button>

          {showProfile && (
            <div
              className="absolute right-0 mt-2 rounded-xl border overflow-hidden animate-fade-in"
              style={{ width: 280, background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)', zIndex: 100 }}
            >
              {/* Profile header */}
              <div
                className="px-4 py-4 border-b"
                style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--surface))', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'var(--primary)' }}
                  >
                    SR
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{staff.name}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{staff.email}</p>
                  </div>
                </div>
              </div>

              {/* Profile details */}
              <div className="px-4 py-3 space-y-2">
                {[
                  { label: 'Staff ID', value: staff.id },
                  { label: t('role'), value: staff.role },
                  { label: t('enrolled'), value: staff.enrollmentDate },
                  { label: t('phone'), value: staff.phone },
                  { label: 'Branch', value: staff.branch },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                    <span className="text-xs font-medium font-mono" style={{ color: 'var(--text-primary)' }}>{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="px-4 py-3 border-t flex gap-2" style={{ borderColor: 'var(--border)' }}>
                <button className="btn-ghost text-xs flex-1 justify-center" style={{ height: 30 }}>
                  <User size={12} /> {t('edit')}
                </button>
                <button className="btn-ghost text-xs flex-1 justify-center" style={{ height: 30, color: '#ef4444', borderColor: '#fee2e2' }}>
                  <Key size={12} /> {t('reset_password')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter drawer */}
      {showFilters && (
        <div
          className="absolute left-0 right-0 top-full z-30 border-b px-5 py-4 animate-fade-in"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '0 4px 20px rgba(198,140,255,0.1)' }}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { key: 'clientId' as const, label: t('client_id') },
              { key: 'score' as const, label: t('score') },
              { key: 'segment' as const, label: t('segment') },
              { key: 'category' as const, label: t('category') },
              { key: 'branch' as const, label: t('branch') },
              { key: 'phone' as const, label: t('phone_number') },
              { key: 'operator' as const, label: t('operator') },
            ].map(field => (
              <div key={field.key}>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>
                  {field.label}
                </label>
                <input
                  className="input-base"
                  style={{ height: 32, fontSize: '0.78rem', padding: '0 10px' }}
                  value={filters[field.key]}
                  onChange={e => setFilters({ ...filters, [field.key]: e.target.value })}
                  placeholder={field.label}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3 justify-end">
            <button className="btn-ghost text-xs" style={{ height: 30 }} onClick={resetFilters}>{t('reset')}</button>
            <button className="btn-primary text-xs" style={{ height: 30 }} onClick={() => setShowFilters(false)}>{t('apply')}</button>
          </div>
        </div>
      )}

      {/* QR Modal */}
      {showQR && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(26,10,46,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowQR(false)}
        >
          <div
            className="rounded-2xl border p-6 animate-fade-in"
            style={{ background: '#fff', borderColor: 'var(--border)', boxShadow: 'var(--shadow-md)', maxWidth: 280 }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{t('qr_code')}</h3>
              <button onClick={() => setShowQR(false)} style={{ cursor: 'pointer', color: 'var(--text-muted)', background: 'none', border: 'none' }}>
                <X size={16} />
              </button>
            </div>
            <div className="qr-container mx-auto" style={{ width: 180, height: 180 }}>
              {/* SVG QR code mock */}
              <svg width="164" height="164" viewBox="0 0 164 164" style={{ imageRendering: 'pixelated' }}>
                <rect width="164" height="164" fill="white" />
                {/* QR pattern simulation */}
                {Array.from({ length: 21 }, (_, r) =>
                  Array.from({ length: 21 }, (_, c) => {
                    const val = ((r * 7 + c * 3 + r * c) % 5 < 2) || (r < 8 && c < 8) || (r < 8 && c > 12) || (r > 12 && c < 8)
                    return val ? (
                      <rect key={`${r}-${c}`} x={r * 7 + 8} y={c * 7 + 8} width="6" height="6" fill="#1a0a2e" />
                    ) : null
                  })
                )}
              </svg>
            </div>
            <p className="text-center mt-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>{staff.id}</p>
          </div>
        </div>
      )}
    </header>
  )
}
