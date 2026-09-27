const STORAGE_KEY = 'flowboard.tokens'

export interface Tokens {
  access: string
  refresh: string
}

type Listener = (tokens: Tokens | null) => void
const listeners = new Set<Listener>()

function read(): Tokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Tokens) : null
  } catch {
    return null
  }
}

let current = read()

export const tokenStore = {
  get: () => current,
  set(tokens: Tokens | null) {
    current = tokens
    try {
      if (tokens) localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable */
    }
    listeners.forEach((listener) => listener(tokens))
  },
  subscribe(listener: Listener) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}
