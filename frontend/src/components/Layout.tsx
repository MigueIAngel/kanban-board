import { Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth/AuthContext'
import { LanguageSwitcher, ThemeToggle } from './Toolbar'

export function Logo() {
  return (
    <span className="flex items-center gap-2 text-lg font-bold">
      <img src="/favicon.svg" alt="" className="h-8 w-8" />
      Flowboard
    </span>
  )
}

export function Layout() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            {user && (
              <span className="hidden px-2 text-sm text-slate-500 sm:inline">@{user.username}</span>
            )}
            <button type="button" className="btn-ghost" onClick={logout}>
              {t('auth.logout')}
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
