import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'
import { boardsApi } from '../api/endpoints'

const gradients = [
  'from-indigo-500 to-sky-400',
  'from-fuchsia-500 to-rose-400',
  'from-emerald-500 to-teal-400',
  'from-amber-500 to-orange-400',
]

export function BoardsPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const boards = useQuery({ queryKey: ['boards'], queryFn: boardsApi.list })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['boards'] })
  const create = useMutation({ mutationFn: boardsApi.create, onSuccess: invalidate })
  const remove = useMutation({ mutationFn: boardsApi.remove, onSuccess: invalidate })

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) return
    create.mutate(name.trim())
    setName('')
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{t('boards.title')}</h1>
        <form onSubmit={submit} className="flex gap-2">
          <input
            className="input w-56"
            placeholder={t('boards.namePlaceholder')}
            value={name}
            onChange={(event) => setName(event.target.value)}
            aria-label={t('boards.namePlaceholder')}
          />
          <button type="submit" className="btn-primary whitespace-nowrap" disabled={create.isPending}>
            + {t('boards.new')}
          </button>
        </form>
      </div>

      {boards.isPending && <p className="text-slate-500">{t('common.loading')}</p>}
      {boards.isError && (
        <p>
          {t('common.error')}{' '}
          <button className="text-brand-600" onClick={() => boards.refetch()}>
            {t('common.retry')}
          </button>
        </p>
      )}
      {boards.data?.length === 0 && <p className="text-slate-500">{t('boards.empty')}</p>}

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {boards.data?.map((board, index) => (
          <li key={board.id} className="group relative">
            <Link
              to={`/boards/${board.id}`}
              className="block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
            >
              <div className={`h-20 bg-gradient-to-br ${gradients[index % gradients.length]}`} />
              <div className="p-4">
                <h2 className="font-semibold">{board.name}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {t('boards.cards', { count: board.card_count })} ·{' '}
                  {new Date(board.created_at).toLocaleDateString(i18n.resolvedLanguage)}
                </p>
              </div>
            </Link>
            <button
              type="button"
              className="absolute top-2 right-2 rounded-full bg-black/20 px-2 text-white opacity-0 transition group-hover:opacity-100 focus:opacity-100"
              aria-label={t('boards.delete')}
              title={t('boards.delete')}
              onClick={() => window.confirm(t('boards.confirmDelete')) && remove.mutate(board.id)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
