import type { Column } from '../api/types'

export interface CardLocation {
  columnId: number
  index: number
}

export function findCard(columns: Column[], cardId: number): CardLocation | null {
  for (const column of columns) {
    const index = column.cards.findIndex((card) => card.id === cardId)
    if (index !== -1) return { columnId: column.id, index }
  }
  return null
}

/**
 * Returns a new columns array with the card moved to `toIndex` of `toColumnId`.
 * Mirrors the backend `Card.move`: the index is clamped and positions are re-numbered.
 */
export function moveCard(
  columns: Column[],
  cardId: number,
  toColumnId: number,
  toIndex: number,
): Column[] {
  const from = findCard(columns, cardId)
  if (!from) return columns
  const card = columns.find((c) => c.id === from.columnId)!.cards[from.index]

  const withoutCard = columns.map((column) =>
    column.id === from.columnId
      ? { ...column, cards: column.cards.filter((c) => c.id !== cardId) }
      : column,
  )

  return withoutCard.map((column) => {
    if (column.id !== toColumnId) {
      return column.id === from.columnId ? renumber(column) : column
    }
    const cards = [...column.cards]
    const index = Math.max(0, Math.min(toIndex, cards.length))
    cards.splice(index, 0, { ...card, column: toColumnId })
    return renumber({ ...column, cards })
  })
}

function renumber(column: Column): Column {
  return { ...column, cards: column.cards.map((card, position) => ({ ...card, position })) }
}
