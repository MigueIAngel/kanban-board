import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Card } from '../api/types'
import { cardDndId } from './dndIds'
import { PriorityBadge } from './PriorityBadge'

interface CardItemProps {
  card: Card
  onOpen?: (card: Card) => void
  overlay?: boolean
}

export function CardView({ card, overlay }: { card: Card; overlay?: boolean }) {
  const { t, i18n } = useTranslation()
  const due = card.due_date ? new Date(`${card.due_date}T00:00:00`) : null
  const overdue = due !== null && due < new Date(new Date().toDateString())

  return (
    <div
      className={clsx(
        'rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm dark:border-slate-700 dark:bg-slate-800',
        overlay && 'rotate-2 shadow-xl ring-2 ring-brand-500',
      )}
    >
      <p className="text-sm font-medium">{card.title}</p>
      {card.description && (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
          {card.description}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <PriorityBadge priority={card.priority} />
        {due && (
          <span className={clsx('text-[11px]', overdue ? 'font-semibold text-rose-600' : 'text-slate-500')}>
            {overdue && `${t('cards.overdue')} · `}
            {due.toLocaleDateString(i18n.resolvedLanguage, { day: 'numeric', month: 'short' })}
          </span>
        )}
      </div>
    </div>
  )
}

export function CardItem({ card, onOpen }: CardItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cardDndId(card.id),
    data: { type: 'card', card },
  })

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={clsx('touch-none', isDragging && 'opacity-40')}
      {...attributes}
      {...listeners}
      onClick={() => onOpen?.(card)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onOpen?.(card)
        listeners?.onKeyDown?.(event)
      }}
    >
      <CardView card={card} />
    </li>
  )
}
