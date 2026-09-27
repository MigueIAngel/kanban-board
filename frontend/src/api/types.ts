export type Priority = 'low' | 'medium' | 'high'

export interface User {
  id: number
  username: string
  email: string
}

export interface Card {
  id: number
  column: number
  title: string
  description: string
  priority: Priority
  due_date: string | null
  position: number
}

export interface Column {
  id: number
  board: number
  title: string
  position: number
  cards: Card[]
}

export interface BoardSummary {
  id: number
  name: string
  created_at: string
  card_count: number
}

export interface Board extends BoardSummary {
  columns: Column[]
}
