import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from './tokens'

export const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const tokens = tokenStore.get()
  if (tokens) config.headers.Authorization = `Bearer ${tokens.access}`
  return config
})

let refreshing: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const tokens = tokenStore.get()
  if (!tokens) throw new Error('Not authenticated')
  const { data } = await axios.post<{ access: string; refresh?: string }>(
    `${API_URL}/auth/token/refresh/`,
    { refresh: tokens.refresh },
  )
  tokenStore.set({ access: data.access, refresh: data.refresh ?? tokens.refresh })
  return data.access
}

/** On a 401, refresh the access token once (shared between parallel requests) and retry. */
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
  if (error.response?.status !== 401 || !original || original._retry || !tokenStore.get()) {
    throw error
  }
  original._retry = true
  try {
    refreshing ??= refreshAccessToken().finally(() => (refreshing = null))
    const access = await refreshing
    original.headers.Authorization = `Bearer ${access}`
    return api(original)
  } catch {
    tokenStore.set(null)
    throw error
  }
})
