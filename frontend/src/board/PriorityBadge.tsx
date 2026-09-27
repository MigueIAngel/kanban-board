import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import type { Priority } from '../api/types'

const styles: Record<Priority, string> = {
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  high: 'bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300',
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  const { t } = useTranslation()
  return (
    <span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-semibold', styles[priority])}>
      {t(`cards.priorities.${priority}`)}
    </span>
  )
}
