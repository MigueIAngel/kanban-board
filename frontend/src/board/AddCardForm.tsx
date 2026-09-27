import { useState } from 'react'
import type { FormEvent } from 'react'
import { useTranslation } from 'react-i18next'

export function AddCardForm({ onAdd }: { onAdd: (title: string) => void }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')

  function submit(event: FormEvent) {
    event.preventDefault()
    if (!title.trim()) return
    onAdd(title.trim())
    setTitle('')
  }

  if (!open) {
    return (
      <button type="button" className="btn-ghost w-full justify-start" onClick={() => setOpen(true)}>
        + {t('cards.add')}
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <input
        autoFocus
        className="input"
        placeholder={t('cards.titlePlaceholder')}
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
      />
      <div className="flex gap-2">
        <button type="submit" className="btn-primary py-1.5">
          {t('cards.add')}
        </button>
        <button type="button" className="btn-ghost py-1.5" onClick={() => setOpen(false)}>
          {t('cards.cancel')}
        </button>
      </div>
    </form>
  )
}
