import { api } from './client'
import type { Board, BoardSummary, Card, Column, Priority, User } from './types'
import type { Tokens } from './tokens'

export const authApi = {
  login: (username: string, password: string) =>
    api.post<Tokens>('/auth/token/', { username, password }).then((r) => r.data),
  register: (data: { username: string; email: string; password: string }) =>
    api.post<User>('/auth/register/', data).then((r) => r.data),
  me: () => api.get<User>('/auth/me/').then((r) => r.data),
}

export const boardsApi = {
  list: () => api.get<BoardSummary[]>('/boards/').then((r) => r.data),
  get: (id: number) => api.get<Board>(`/boards/${id}/`).then((r) => r.data),
  create: (name: string) => api.post<BoardSummary>('/boards/', { name }).then((r) => r.data),
  remove: (id: number) => api.delete(`/boards/${id}/`),
}

export const columnsApi = {
  create: (board: number, title: string) =>
    api.post<Column>('/columns/', { board, title }).then((r) => r.data),
  remove: (id: number) => api.delete(`/columns/${id}/`),
}

export interface CardInput {
  title: string
  description?: string
  priority?: Priority
  due_date?: string | null
}

export const cardsApi = {
  create: (column: number, data: CardInput) =>
    api.post<Card>('/cards/', { column, ...data }).then((r) => r.data),
  update: (id: number, data: Partial<CardInput>) =>
    api.patch<Card>(`/cards/${id}/`, data).then((r) => r.data),
  remove: (id: number) => api.delete(`/cards/${id}/`),
  move: (id: number, column: number, position: number) =>
    api.post<Card>(`/cards/${id}/move/`, { column, position }).then((r) => r.data),
}
