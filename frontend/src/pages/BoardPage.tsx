import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useParams } from 'react-router'
import type { Card } from '../api/types'
import { CardModal } from '../board/CardModal'
import { KanbanBoard } from '../board/KanbanBoard'
import { useBoard } from '../board/useBoard'

export function BoardPage() {
  const { t } = useTranslation()
  const boardId = Number(useParams().boardId)
  const { query, moveCardTo, createCard, updateCard, deleteCard, createColumn, deleteColumn } =
    useBoard(boardId)
  const [openCard, setOpenCard] = useState<Card | null>(null)
  const [columnTitle, setColumnTitle] = useState('')

  if (query.isPending) return <p className="p-8 text-slate-500">{t('common.loading')}</p>
  if (query.isError) {
    return (
      <div className="p-8">
        <p>{t('boards.notFound')}</p>
        <Link to="/" className="text-brand-600">← {t('boards.back')}</Link>
      </div>
    )
  }

  const board = query.data

  function addColumn(event: FormEvent) {
    event.preventDefault()
    if (!columnTitle.trim()) return
    createColumn.mutate(columnTitle.trim())
    setColumnTitle('')
  }

  return (
    <div className="px-4 py-6">
      <div className="mx-auto mb-6 flex max-w-[1400px] flex-wrap items-end justify-between gap-4">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-brand-600">
            ← {t('boards.back')}
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{board.name}</h1>
        </div>
        <form onSubmit={addColumn} className="flex gap-2">
          <input
            className="input w-48"
            placeholder={t('columns.titlePlaceholder')}
            value={columnTitle}
            onChange={(event) => setColumnTitle(event.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            + {t('columns.add')}
          </button>
        </form>
      </div>

      <div className="mx-auto max-w-[1400px] overflow-x-auto pb-6">
        <KanbanBoard
          columns={board.columns}
          onMove={moveCardTo}
          onAddCard={(columnId, title) => createCard.mutate({ columnId, data: { title } })}
          onOpenCard={setOpenCard}
          onDeleteColumn={(columnId) =>
            window.confirm(t('columns.confirmDelete')) && deleteColumn.mutate(columnId)
          }
        />
      </div>

      {openCard && (
        <CardModal
          card={openCard}
          onClose={() => setOpenCard(null)}
          onSave={(data) => {
            updateCard.mutate({ cardId: openCard.id, data })
            setOpenCard(null)
          }}
          onDelete={() => {
            deleteCard.mutate(openCard.id)
            setOpenCard(null)
          }}
        />
      )}
    </div>
  )
}
