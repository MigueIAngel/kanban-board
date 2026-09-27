import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

function initialDark(): boolean {
  try {
    const saved = localStorage.getItem('flowboard.dark')
    if (saved !== null) return saved === 'true'
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
}

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation()
  const next = i18n.resolvedLanguage === 'es' ? 'en' : 'es'
  return (
    <button
      type="button"
      className="btn-ghost px-3"
      title={t('common.language')}
      onClick={() => void i18n.changeLanguage(next)}
    >
      🌐 {next.toUpperCase()}
    </button>
  )
}

export function ThemeToggle() {
  const { t } = useTranslation()
  const [dark, setDark] = useState(initialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('flowboard.dark', String(dark))
    } catch {
      /* storage unavailable */
    }
  }, [dark])

  return (
    <button
      type="button"
      className="btn-ghost px-3"
      title={t('common.theme')}
      aria-label={t('common.theme')}
      onClick={() => setDark((value) => !value)}
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}
