'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ApiError, changerMotDePasse, login } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  // US-A2 : au premier login, le backend force le changement de mot de passe.
  const [doitChanger, setDoitChanger] = useState(false)
  const [nouveau, setNouveau] = useState('')
  const [confirme, setConfirme] = useState('')

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    setLoading(true)
    try {
      const jeton = await login(email, password)
      if (jeton.must_change_password) {
        setDoitChanger(true) // on bascule sur le formulaire de changement
      } else {
        router.push('/configuration')
      }
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setLoading(false)
    }
  }

  async function handleChangement(e: React.FormEvent) {
    e.preventDefault()
    setErreur(null)
    if (nouveau !== confirme) {
      setErreur('Les deux mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await changerMotDePasse(password, nouveau)
      router.push('/configuration')
    } catch (err) {
      setErreur(messageErreur(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="mb-6 inline-flex size-20 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-border">
            <Image
              src="/finzuu-icon.jpeg"
              alt="FinZuu Loader"
              width={80}
              height={80}
              className="size-20 object-contain"
              priority
            />
          </span>
          <h1 className="text-pretty text-2xl font-bold text-foreground">
            {doitChanger ? 'Changez votre mot de passe' : 'Bienvenue sur FinZuu Loader'}
          </h1>
          <p className="mt-2 text-balance text-sm leading-relaxed text-muted-foreground">
            {doitChanger
              ? 'Votre mot de passe initial doit être remplacé avant de continuer.'
              : "Connectez-vous pour accéder à l'outil de génération de données TEST/DEMO."}
          </p>
        </div>

        <form
          onSubmit={doitChanger ? handleChangement : handleLogin}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-7"
        >
          <div className="space-y-4">
            {erreur && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {erreur}
              </div>
            )}

            {!doitChanger ? (
              <>
                <Champ id="email" label="Email" type="email" value={email} onChange={setEmail} />
                <ChampMotDePasse
                  label="Mot de passe"
                  value={password}
                  onChange={setPassword}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </>
            ) : (
              <>
                <ChampMotDePasse
                  label="Nouveau mot de passe"
                  value={nouveau}
                  onChange={setNouveau}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
                <ChampMotDePasse
                  label="Confirmer le mot de passe"
                  value={confirme}
                  onChange={setConfirme}
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={loading}
              className="h-11 w-full text-sm font-semibold"
            >
              {loading
                ? 'Veuillez patienter…'
                : doitChanger
                  ? 'Enregistrer et continuer'
                  : 'Se connecter'}
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">FinZuu Loader</p>
      </div>
    </main>
  )
}

function messageErreur(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'Backend injoignable — réessayez dans un instant.'
    if (err.status === 401) return 'Email ou mot de passe incorrect.'
    if (typeof err.detail === 'string') return err.detail
    return `Erreur ${err.status}.`
  }
  return 'Une erreur est survenue.'
}

function Champ({
  id,
  label,
  type,
  value,
  onChange,
}: {
  id: string
  label: string
  type: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        id={id}
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
      />
    </div>
  )
}

function ChampMotDePasse({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-11 text-sm text-foreground outline-none transition focus:border-ring focus:ring-3 focus:ring-ring/20"
        />
        <button
          type="button"
          onClick={onToggle}
          aria-label={show ? 'Masquer' : 'Afficher'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </div>
  )
}
