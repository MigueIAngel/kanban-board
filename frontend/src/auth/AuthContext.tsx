import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { authApi } from '../api/endpoints'
import { tokenStore } from '../api/tokens'
import type { User } from '../api/types'

interface AuthContextValue {
  user: User | undefined
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  register: (data: { username: string; email: string; password: string }) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [isAuthenticated, setAuthenticated] = useState(() => tokenStore.get() !== null)

  // Keep React state in sync when tokens change (e.g. refresh failed in the interceptor).
  useEffect(
    () =>
      tokenStore.subscribe((tokens) => {
        setAuthenticated(tokens !== null)
        if (!tokens) queryClient.clear()
      }),
    [queryClient],
  )

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: authApi.me,
    enabled: isAuthenticated,
    staleTime: Infinity,
  })

  const login = useCallback(async (username: string, password: string) => {
    tokenStore.set(await authApi.login(username, password))
  }, [])

  const register = useCallback(
    async (data: { username: string; email: string; password: string }) => {
      await authApi.register(data)
      await login(data.username, data.password)
    },
    [login],
  )

  const logout = useCallback(() => tokenStore.set(null), [])

  const value = useMemo(
    () => ({ user, isAuthenticated, login, register, logout }),
    [user, isAuthenticated, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
