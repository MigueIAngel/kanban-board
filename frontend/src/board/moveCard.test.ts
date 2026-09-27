import { describe, expect, it } from 'vitest'
import type { Card, Column } from '../api/types'
import { findCard, moveCard } from './moveCard'

const card = (id: number, column: number, position: number): Card => ({
  id,
  column,
  position,
  title: `Card ${id}`,
  description: '',
  priority: 'medium',
  due_date: null,
})

const columns: Column[] = [
  { id: 1, board: 1, title: 'To do', position: 0, cards: [card(1, 1, 0), card(2, 1, 1), card(3, 1, 2)] },
  { id: 2, board: 1, title: 'Doing', position: 1, cards: [card(4, 2, 0)] },
  { id: 3, board: 1, title: 'Done', position: 2, cards: [] },
]

const ids = (cols: Column[], columnId: number) =>
  cols.find((c) => c.id === columnId)!.cards.map((c) => c.id)

describe('moveCard', () => {
  it('reorders a card inside the same column', () => {
    const result = moveCard(columns, 3, 1, 0)
    expect(ids(result, 1)).toEqual([3, 1, 2])
    expect(result[0].cards.map((c) => c.position)).toEqual([0, 1, 2])
  })

  it('moves a card to another column and renumbers both', () => {
    const result = moveCard(columns, 2, 2, 0)
    expect(ids(result, 1)).toEqual([1, 3])
    expect(ids(result, 2)).toEqual([2, 4])
    expect(result[0].cards.map((c) => c.position)).toEqual([0, 1])
    expect(result[1].cards.find((c) => c.id === 2)?.column).toBe(2)
  })

  it('clamps the index to the end of the target column', () => {
    expect(ids(moveCard(columns, 1, 3, 99), 3)).toEqual([1])
  })

  it('does not mutate the input', () => {
    const snapshot = structuredClone(columns)
    moveCard(columns, 1, 2, 0)
    expect(columns).toEqual(snapshot)
  })

  it('returns the same columns for an unknown card', () => {
    expect(moveCard(columns, 999, 1, 0)).toBe(columns)
  })

  it('finds a card location', () => {
    expect(findCard(columns, 4)).toEqual({ columnId: 2, index: 0 })
    expect(findCard(columns, 42)).toBeNull()
  })
})
