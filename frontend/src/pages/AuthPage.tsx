import { isAxiosError } from 'axios'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Logo } from '../components/Layout'
import { LanguageSwitcher, ThemeToggle } from '../components/Toolbar'

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { t } = useTranslation()
  const { login, register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const update = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((values) => ({ ...values, [field]: event.target.value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      if (mode === 'login') await login(form.username, form.password)
      else await register(form)
      navigate('/')
    } catch (err) {
      const status = isAxiosError(err) ? err.response?.status : undefined
      setError(mode === 'login' && status === 401 ? t('auth.invalid') : t(mode === 'login' ? 'common.error' : 'auth.registerError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative grid min-h-screen place-items-center bg-gradient-to-br from-brand-100 via-slate-100 to-sky-100 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      <div className="absolute top-4 right-4 flex">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <Logo />
        <p className="mt-2 mb-6 text-sm text-slate-500">{t('app.tagline')}</p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block text-sm font-medium">
            {t('auth.username')}
            <input className="input mt-1" value={form.username} onChange={update('username')} required autoComplete="username" />
          </label>
          {mode === 'register' && (
            <label className="block text-sm font-medium">
              {t('auth.email')}
              <input className="input mt-1" type="email" value={form.email} onChange={update('email')} required />
            </label>
          )}
          <label className="block text-sm font-medium">
            {t('auth.password')}
            <input
              className="input mt-1"
              type="password"
              value={form.password}
              onChange={update('password')}
              required
              minLength={8}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            />
          </label>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {t(mode === 'login' ? 'auth.login' : 'auth.register')}
          </button>
        </form>

        {mode === 'login' && (
          <button
            type="button"
            className="btn-ghost mt-2 w-full"
            onClick={() => setForm({ username: 'demo', email: '', password: 'kanban12345' })}
          >
            ✨ {t('auth.demo')}
          </button>
        )}

        <p className="mt-6 text-center text-sm text-slate-500">
          {mode === 'login' ? t('auth.noAccount') : t('auth.haveAccount')}{' '}
          <Link className="font-semibold text-brand-600" to={mode === 'login' ? '/register' : '/login'}>
            {t(mode === 'login' ? 'auth.register' : 'auth.login')}
          </Link>
        </p>
      </div>
    </div>
  )
}
