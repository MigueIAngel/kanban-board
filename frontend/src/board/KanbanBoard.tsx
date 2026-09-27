import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { useRef, useState } from 'react'
import type { Card, Column } from '../api/types'
import { CardView } from './CardItem'
import { ColumnView } from './ColumnView'
import { type CardLocation, findCard, moveCard } from './moveCard'

interface KanbanBoardProps {
  columns: Column[]
  onMove: (cardId: number, columnId: number, index: number) => void
  onAddCard: (columnId: number, title: string) => void
  onOpenCard: (card: Card) => void
  onDeleteColumn: (columnId: number) => void
}

const parseId = (id: UniqueIdentifier) => {
  const [type, value] = String(id).split('-')
  return { type: type as 'card' | 'column', id: Number(value) }
}

export function KanbanBoard({ columns: serverColumns, onMove, onAddCard, onOpenCard, onDeleteColumn }: KanbanBoardProps) {
  // While dragging, a local copy lets cards jump between columns (onDragOver).
  // Otherwise the server data (with optimistic updates) is rendered directly.
  const [dragColumns, setDragColumns] = useState<Column[] | null>(null)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const origin = useRef<CardLocation | null>(null)
  const columns = dragColumns ?? serverColumns

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  /** Column id and index targeted by `overId` (a card or an empty column). */
  function resolveTarget(cols: Column[], overId: UniqueIdentifier): CardLocation | null {
    const over = parseId(overId)
    if (over.type === 'column') {
      const column = cols.find((c) => c.id === over.id)
      return column ? { columnId: column.id, index: column.cards.length } : null
    }
    return findCard(cols, over.id)
  }

  function handleDragStart({ active }: DragStartEvent) {
    const { id } = parseId(active.id)
    origin.current = findCard(columns, id)
    const location = origin.current
    setDragColumns(columns)
    setActiveCard(location ? columns.find((c) => c.id === location.columnId)!.cards[location.index] : null)
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over) return
    const cardId = parseId(active.id).id
    setDragColumns((cols) => {
      if (!cols) return cols
      const from = findCard(cols, cardId)
      const to = resolveTarget(cols, over.id)
      if (!from || !to || from.columnId === to.columnId) return cols
      return moveCard(cols, cardId, to.columnId, to.index)
    })
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    const cardId = parseId(active.id).id
    setActiveCard(null)
    setDragColumns(null)
    if (!over || !origin.current) return
    let next = columns
    const from = findCard(next, cardId)
    const to = resolveTarget(next, over.id)
    if (from && to && from.columnId === to.columnId && from.index !== to.index) {
      next = moveCard(next, cardId, to.columnId, to.index)
    }
    const final = findCard(next, cardId)
    const start = origin.current
    if (final && (final.columnId !== start.columnId || final.index !== start.index)) {
      onMove(cardId, final.columnId, final.index)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setActiveCard(null)
        setDragColumns(null)
      }}
    >
      <div className="flex items-start gap-4">
        {columns.map((column) => (
          <ColumnView
            key={column.id}
            column={column}
            onAddCard={(title) => onAddCard(column.id, title)}
            onOpenCard={onOpenCard}
            onDelete={() => onDeleteColumn(column.id)}
          />
        ))}
      </div>
      <DragOverlay>{activeCard && <CardView card={activeCard} overlay />}</DragOverlay>
    </DndContext>
  )
}
