import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { CardInput } from '../api/endpoints'
import type { Card, Priority } from '../api/types'

interface CardModalProps {
  card: Card
  onClose: () => void
  onSave: (data: Partial<CardInput>) => void
  onDelete: () => void
}

export function CardModal({ card, onClose, onSave, onDelete }: CardModalProps) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: card.title,
    description: card.description,
    priority: card.priority,
    due_date: card.due_date ?? '',
  })

  function submit(event: FormEvent) {
    event.preventDefault()
    onSave({ ...form, due_date: form.due_date || null })
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
      onKeyDown={(event) => event.key === 'Escape' && onClose()}
      role="presentation"
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onSubmit={submit}
        className="w-full max-w-lg space-y-4 rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900"
      >
        <h2 id="card-modal-title" className="text-lg font-bold">
          {t('cards.edit')}
        </h2>
        <label className="block text-sm font-medium">
          {t('cards.title')}
          <input
            autoFocus
            required
            className="input mt-1"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </label>
        <label className="block text-sm font-medium">
          {t('cards.description')}
          <textarea
            rows={4}
            className="input mt-1"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm font-medium">
            {t('cards.priority')}
            <select
              className="input mt-1"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            >
              {(['low', 'medium', 'high'] as const).map((p) => (
                <option key={p} value={p}>
                  {t(`cards.priorities.${p}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            {t('cards.dueDate')}
            <input
              type="date"
              className="input mt-1"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </label>
        </div>
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            className="btn-danger"
            onClick={() => window.confirm(t('cards.confirmDelete')) && onDelete()}
          >
            {t('cards.delete')}
          </button>
          <div className="flex gap-2">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {t('cards.cancel')}
            </button>
            <button type="submit" className="btn-primary">
              {t('cards.save')}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
