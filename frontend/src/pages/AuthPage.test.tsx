import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authApi } from '../api/endpoints'
import { AuthProvider } from '../auth/AuthContext'
import i18n from '../i18n'
import { AuthPage } from './AuthPage'

function renderLogin() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AuthProvider>
          <AuthPage mode="login" />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('AuthPage', () => {
  beforeEach(async () => {
    localStorage.clear()
    vi.restoreAllMocks()
    await i18n.changeLanguage('en')
  })

  it('fills the demo account and logs in', async () => {
    const login = vi
      .spyOn(authApi, 'login')
      .mockResolvedValue({ access: 'access-token', refresh: 'refresh-token' })
    vi.spyOn(authApi, 'me').mockResolvedValue({ id: 1, username: 'demo', email: '' })

    renderLogin()
    await userEvent.click(screen.getByRole('button', { name: /demo/i }))
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(login).toHaveBeenCalledWith('demo', 'kanban12345')
    expect(localStorage.getItem('flowboard.tokens')).toContain('access-token')
  })

  it('shows an error for invalid credentials', async () => {
    vi.spyOn(authApi, 'login').mockRejectedValue(
      Object.assign(new Error('Unauthorized'), { isAxiosError: true, response: { status: 401 } }),
    )

    renderLogin()
    await userEvent.type(screen.getByLabelText('Username'), 'nobody')
    await userEvent.type(screen.getByLabelText('Password'), 'wrong-password')
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid username or password')
  })

  it('is translated to Spanish', async () => {
    await i18n.changeLanguage('es')
    renderLogin()
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeInTheDocument()
  })
})
