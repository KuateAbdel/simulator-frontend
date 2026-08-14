// src/pages/BackOffice.tsx
import React, { useState } from 'react'
import {
  Users, Globe, Building2, Plug, Database, Package,
  FileDown, FileUp, Mail, Share2, Plus, Check, Trash2, Edit3,
  Shield, Key, Send, MessageSquare, Instagram, Linkedin
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import { SectionHeader, Card, TabBar, StatusBadge } from '../components/ui'

type BOSection = 'admin' | 'products' | 'reporting' | 'marketing'

const USERS = [
  { id: 'USR-001', name: 'Sophie Renard', role: 'Portfolio Manager', branch: 'Dakar Centre', status: 'active', perms: ['read', 'write', 'export'] },
  { id: 'USR-002', name: 'Lamine Diallo', role: 'Loan Officer', branch: 'Thiès', status: 'active', perms: ['read', 'write'] },
  { id: 'USR-003', name: 'Mariama Fall', role: 'Analytics', branch: 'Saint-Louis', status: 'inactive', perms: ['read'] },
  { id: 'USR-004', name: 'Omar Ndiaye', role: 'Super Admin', branch: 'Siège', status: 'active', perms: ['read', 'write', 'delete', 'export', 'admin'] },
]

const PRODUCTS_LIST = [
  { id: 'PROD-001', name: 'Prêt Individuel 12M', type: 'loans', rate: '18%', status: 'active' },
  { id: 'PROD-002', name: 'Prêt Groupe AgriSave', type: 'bulk', rate: '14%', status: 'active' },
  { id: 'PROD-003', name: 'Épargne Mensuelle', type: 'savings', rate: '4.5%', status: 'active' },
  { id: 'PROD-004', name: 'Crédit Marchandises', type: 'goods', rate: '12%', status: 'inactive' },
  { id: 'PROD-005', name: 'Programme MFI Partenaire', type: 'program', rate: '9%', status: 'active' },
]

const PERM_LABELS: Record<string, { label: string; color: string }> = {
  read:   { label: 'Lecture',     color: '#0ea5e9' },
  write:  { label: 'Écriture',    color: '#8b5cf6' },
  delete: { label: 'Suppression', color: '#ef4444' },
  export: { label: 'Export',      color: '#f59e0b' },
  admin:  { label: 'Admin',       color: '#19af58' },
}

const PRODUCT_TYPES: Record<string, { label: string; color: string }> = {
  loans:   { label: 'Prêt',       color: 'var(--primary)' },
  savings: { label: 'Épargne',    color: 'var(--secondary)' },
  goods:   { label: 'Biens',      color: '#f59e0b' },
  bulk:    { label: 'Collectif',  color: '#0ea5e9' },
  program: { label: 'Programme',  color: '#8b5cf6' },
}

const PLUGINS = [
  { id: 'sms', name: 'SMS Gateway', provider: 'Twilio', status: 'active', icon: '📱' },
  { id: 'mm', name: 'Mobile Money', provider: 'Orange Money / Wave', status: 'active', icon: '💸' },
  { id: 'agg', name: 'Aggregateur', provider: 'InTouch', status: 'pending', icon: '🔗' },
  { id: 'kafka', name: 'Kafka Middleware', provider: 'Confluent Cloud', status: 'active', icon: '⚙️' },
  { id: 'sftp', name: 'SFTP Transfer', provider: 'Internal', status: 'active', icon: '📂' },
]

export function BackOffice() {
  const { t } = useApp()
  const [section, setSection] = useState<BOSection>('admin')
  const [adminTab, setAdminTab] = useState('users')
  const [productType, setProductType] = useState('all')
  const [campaignText, setCampaignText] = useState('')
  const [sent, setSent] = useState(false)

  const sections: { id: BOSection; label: string; icon: React.ReactNode }[] = [
    { id: 'admin', label: t('administration'), icon: <Shield size={15} /> },
    { id: 'products', label: t('create_products'), icon: <Package size={15} /> },
    { id: 'reporting', label: t('reporting'), icon: <FileDown size={15} /> },
    { id: 'marketing', label: t('marketing'), icon: <Share2 size={15} /> },
  ]

  const adminTabs = [
    { id: 'users', label: t('new_users') },
    { id: 'country', label: t('setup_country') },
    { id: 'company', label: t('setup_company') },
    { id: 'plugins', label: t('plugins') },
  ]

  const filteredProducts = productType === 'all'
    ? PRODUCTS_LIST
    : PRODUCTS_LIST.filter(p => p.type === productType)

  return (
    <div className="animate-fade-in space-y-5">
      <SectionHeader title={t('nav_backoffice')} subtitle="Administration, configuration et outils" />

      {/* Section tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className="flex items-center gap-2 p-3 rounded-xl border text-left transition-all"
            style={{
              borderColor: section === s.id ? 'var(--primary)' : 'var(--border)',
              background: section === s.id ? 'var(--primary-light)' : '#fff',
              color: section === s.id ? 'var(--primary-dark)' : 'var(--text-secondary)',
              cursor: 'pointer',
              fontWeight: section === s.id ? 600 : 400,
            }}
          >
            <span className="flex-shrink-0">{s.icon}</span>
            <span className="text-xs">{s.label}</span>
          </button>
        ))}
      </div>

      {/* ADMIN */}
      {section === 'admin' && (
        <div className="space-y-4">
          <TabBar tabs={adminTabs} active={adminTab} onChange={setAdminTab} />

          {adminTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button className="btn-primary text-xs" style={{ height: 34 }}>
                  <Plus size={13} /> {t('new_users')}
                </button>
              </div>
              <Card style={{ padding: 0, overflow: 'hidden' }}>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{t('name')}</th>
                        <th>{t('role')}</th>
                        <th>{t('branch')}</th>
                        <th>{t('access_rights')}</th>
                        <th>{t('status')}</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {USERS.map(user => (
                        <tr key={user.id}>
                          <td><span className="font-mono text-xs" style={{ color: 'var(--primary-dark)' }}>{user.id}</span></td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: 'var(--primary)' }}>
                                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                              </div>
                              <span className="text-xs font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td><span className="badge-primary text-[10px]">{user.role}</span></td>
                          <td><span className="text-xs">{user.branch}</span></td>
                          <td>
                            <div className="flex flex-wrap gap-1">
                              {user.perms.map(p => (
                                <span key={p} className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: PERM_LABELS[p]?.color + '20', color: PERM_LABELS[p]?.color }}>
                                  {PERM_LABELS[p]?.label}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td><StatusBadge status={user.status} /></td>
                          <td>
                            <div className="flex gap-1">
                              <button className="btn-ghost text-xs px-2" style={{ height: 26, color: '#0ea5e9', borderColor: '#bae6fd' }}><Edit3 size={11} /></button>
                              <button className="btn-ghost text-xs px-2" style={{ height: 26, color: '#ef4444', borderColor: '#fee2e2' }}><Trash2 size={11} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {adminTab === 'country' && (
            <Card style={{ padding: '16px' }}>
              <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{t('setup_country')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Pays', value: 'Sénégal' },
                  { label: 'Devise', value: 'XOF / FCFA' },
                  { label: 'TVA', value: '18%' },
                  { label: 'Langue par défaut', value: 'Français' },
                  { label: 'Fuseau horaire', value: 'Africa/Dakar (UTC+0)' },
                  { label: 'Opérateurs TELCO', value: 'Orange, Free, MTN, Expresso' },
                ].map(item => (
                  <div key={item.label}>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>{item.label}</label>
                    <input className="input-base" style={{ height: 34 }} defaultValue={item.value} />
                  </div>
                ))}
              </div>
              <button className="btn-primary text-xs mt-4" style={{ height: 34 }}><Check size={12} /> {t('save')}</button>
            </Card>
          )}

          {adminTab === 'company' && (
            <Card style={{ padding: '16px' }}>
              <p className="font-display font-semibold text-sm mb-4" style={{ color: 'var(--text-primary)' }}>{t('setup_company')}</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: 'Nom société', value: 'Finzuu MFI SA' },
                  { label: 'Type', value: 'Microfinance' },
                  { label: 'Banque partenaire', value: 'BCS - Banque de Crédit du Sénégal' },
                  { label: 'Custodian', value: 'BCEAO Régional' },
                  { label: 'Prêteur référent', value: 'Société Générale' },
                  { label: 'Immatriculation', value: 'SN-DKR-2018-12349' },
                ].map(item => (
                  <div key={item.label}>
                    <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>{item.label}</label>
                    <input className="input-base" style={{ height: 34 }} defaultValue={item.value} />
                  </div>
                ))}
              </div>
              <button className="btn-primary text-xs mt-4" style={{ height: 34 }}><Check size={12} /> {t('save')}</button>
            </Card>
          )}

          {adminTab === 'plugins' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLUGINS.map(plugin => (
                <Card key={plugin.id} style={{ padding: '14px' }}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 20 }}>{plugin.icon}</span>
                      <div>
                        <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{plugin.name}</p>
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{plugin.provider}</p>
                      </div>
                    </div>
                    <StatusBadge status={plugin.status} />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button className="btn-ghost text-xs flex-1 justify-center" style={{ height: 28 }}>Config</button>
                    <button className="btn-secondary text-xs flex-1 justify-center" style={{ height: 28 }}>
                      <Plug size={11} /> Connecter
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PRODUCTS */}
      {section === 'products' && (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Type:</span>
            {['all', 'loans', 'savings', 'goods', 'bulk', 'program'].map(type => (
              <button
                key={type}
                onClick={() => setProductType(type)}
                className="text-xs rounded-full px-3 py-1 border transition-all"
                style={{
                  borderColor: productType === type ? 'var(--primary)' : 'var(--border)',
                  background: productType === type ? 'var(--primary)' : 'transparent',
                  color: productType === type ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                {type === 'all' ? t('all') : PRODUCT_TYPES[type]?.label}
              </button>
            ))}
            <button className="btn-primary text-xs ml-auto" style={{ height: 32 }}>
              <Plus size={12} /> Nouveau produit
            </button>
          </div>

          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>{t('name')}</th>
                    <th>Type</th>
                    <th>Taux</th>
                    <th>{t('status')}</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map(prod => (
                    <tr key={prod.id}>
                      <td><span className="font-mono text-xs" style={{ color: 'var(--primary-dark)' }}>{prod.id}</span></td>
                      <td><span className="text-xs font-semibold">{prod.name}</span></td>
                      <td>
                        <span
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: (PRODUCT_TYPES[prod.type]?.color || 'var(--primary)') + '15',
                            color: PRODUCT_TYPES[prod.type]?.color || 'var(--primary)',
                          }}
                        >
                          {PRODUCT_TYPES[prod.type]?.label}
                        </span>
                      </td>
                      <td><span className="font-mono text-xs font-semibold" style={{ color: 'var(--secondary)' }}>{prod.rate}</span></td>
                      <td><StatusBadge status={prod.status} /></td>
                      <td>
                        <div className="flex gap-1">
                          <button className="btn-ghost text-xs px-2" style={{ height: 26 }}><Edit3 size={11} /></button>
                          <button className="btn-ghost text-xs px-2" style={{ height: 26, color: '#ef4444', borderColor: '#fee2e2' }}><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* REPORTING */}
      {section === 'reporting' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card style={{ padding: '16px' }}>
              <div className="flex items-center gap-2 mb-4">
                <FileDown size={16} style={{ color: 'var(--primary)' }} />
                <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('export')}</p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Rapport portefeuille', formats: ['PDF', 'CSV', 'JSON'] },
                  { label: 'Transactions clients', formats: ['CSV', 'XLSX'] },
                  { label: 'Rapport PAR/Risque', formats: ['PDF', 'JSON'] },
                  { label: 'Export SFTP automatique', formats: ['CSV'] },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</span>
                    <div className="flex gap-1">
                      {item.formats.map(fmt => (
                        <button key={fmt} className="btn-ghost text-[10px] px-2" style={{ height: 24 }}>
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: '16px' }}>
              <div className="flex items-center gap-2 mb-4">
                <FileUp size={16} style={{ color: 'var(--secondary)' }} />
                <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('import')}</p>
              </div>
              <div
                className="border-2 border-dashed rounded-xl p-8 text-center mb-3"
                style={{ borderColor: 'var(--border)', cursor: 'pointer', background: 'var(--surface)' }}
              >
                <FileUp size={24} className="mx-auto mb-2" style={{ color: 'var(--primary)', opacity: 0.5 }} />
                <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Glisser-déposer un fichier ici</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>CSV, JSON, XLSX — max 50MB</p>
              </div>
              <div className="flex gap-2">
                <button className="btn-ghost text-xs flex-1 justify-center" style={{ height: 32 }}>Parcourir</button>
                <button className="btn-secondary text-xs flex-1 justify-center" style={{ height: 32 }}>Importer</button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* MARKETING */}
      {section === 'marketing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMS Campaign */}
          <Card style={{ padding: '16px' }}>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} style={{ color: 'var(--primary)' }} />
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('sms_campaign')}</p>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>Segment cible</label>
                <select className="input-base" style={{ height: 34 }}>
                  <option>Tous les clients</option>
                  <option>Segment 4–5</option>
                  <option>Prêts en retard</option>
                  <option>Nouveaux inscrits</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold uppercase tracking-wide mb-1 block" style={{ color: 'var(--text-muted)' }}>Message</label>
                <textarea
                  className="input-base"
                  style={{ height: 80, resize: 'none', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', padding: '8px 12px' }}
                  placeholder="Votre message SMS..."
                  value={campaignText}
                  onChange={e => setCampaignText(e.target.value)}
                  maxLength={160}
                />
                <p className="text-right text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{campaignText.length}/160</p>
              </div>
              {sent ? (
                <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: 'var(--secondary)' }}>
                  <Check size={14} /> Campagne envoyée avec succès !
                </div>
              ) : (
                <button
                  className="btn-primary text-xs w-full justify-center"
                  style={{ height: 34 }}
                  onClick={() => { setSent(true); setTimeout(() => setSent(false), 3000) }}
                >
                  <Send size={12} /> Envoyer la campagne
                </button>
              )}
            </div>
          </Card>

          {/* Social Networks */}
          <Card style={{ padding: '16px' }}>
            <div className="flex items-center gap-2 mb-4">
              <Share2 size={16} style={{ color: '#0ea5e9' }} />
              <p className="font-display font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>{t('social_network')}</p>
            </div>
            <div className="space-y-2">
              {[
                { name: 'WhatsApp', color: '#25D366', status: 'active', icon: '💬', reach: '1,248 contacts' },
                { name: 'TikTok', color: '#010101', status: 'inactive', icon: '🎵', reach: '—' },
                { name: 'Instagram', color: '#E1306C', status: 'active', icon: '📸', reach: '842 abonnés' },
                { name: 'Facebook', color: '#1877F2', status: 'active', icon: '📘', reach: '2,104 abonnés' },
                { name: 'LinkedIn', color: '#0A66C2', status: 'inactive', icon: '💼', reach: '—' },
              ].map(sn => (
                <div key={sn.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 18 }}>{sn.icon}</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{sn.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{sn.reach}</p>
                  </div>
                  <button
                    className="text-xs px-3 py-1 rounded-lg font-semibold border transition-all"
                    style={{
                      borderColor: sn.status === 'active' ? sn.color : 'var(--border)',
                      background: sn.status === 'active' ? sn.color + '15' : 'transparent',
                      color: sn.status === 'active' ? sn.color : 'var(--text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {sn.status === 'active' ? 'Connecté' : 'Connecter'}
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
