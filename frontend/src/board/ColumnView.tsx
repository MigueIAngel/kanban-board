import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Card, Column } from '../api/types'
import { AddCardForm } from './AddCardForm'
import { CardItem } from './CardItem'
import { cardDndId, columnDndId } from './dndIds'

interface ColumnViewProps {
  column: Column
  onAddCard: (title: string) => void
  onOpenCard: (card: Card) => void
  onDelete: () => void
}

export function ColumnView({ column, onAddCard, onOpenCard, onDelete }: ColumnViewProps) {
  const { t } = useTranslation()
  const { setNodeRef, isOver } = useDroppable({
    id: columnDndId(column.id),
    data: { type: 'column', columnId: column.id },
  })

  return (
    <section
      aria-label={column.title}
      className={clsx(
        'flex w-72 shrink-0 flex-col rounded-3xl bg-slate-200/70 p-3 dark:bg-slate-900',
        isOver && 'ring-2 ring-brand-400',
      )}
    >
      <header className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-bold">
          {column.title}
          <span className="ml-2 rounded-full bg-white px-2 py-0.5 text-xs text-slate-500 dark:bg-slate-800">
            {column.cards.length}
          </span>
        </h2>
        <button
          type="button"
          className="rounded-lg px-2 text-slate-400 hover:bg-slate-300 hover:text-slate-700 dark:hover:bg-slate-800"
          title={t('columns.delete')}
          aria-label={t('columns.delete')}
          onClick={onDelete}
        >
          ×
        </button>
      </header>

      <SortableContext items={column.cards.map((c) => cardDndId(c.id))} strategy={verticalListSortingStrategy}>
        <ul ref={setNodeRef} className="flex min-h-12 flex-1 flex-col gap-2">
          {column.cards.map((card) => (
            <CardItem key={card.id} card={card} onOpen={onOpenCard} />
          ))}
        </ul>
      </SortableContext>

      <div className="mt-3">
        <AddCardForm onAdd={onAddCard} />
      </div>
    </section>
  )
}
