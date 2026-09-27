import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { type CardInput, boardsApi, cardsApi, columnsApi } from '../api/endpoints'
import type { Board } from '../api/types'
import { moveCard } from './moveCard'

export const boardKey = (id: number) => ['board', id] as const

export function useBoard(boardId: number) {
  const queryClient = useQueryClient()
  const key = boardKey(boardId)
  const query = useQuery({ queryKey: key, queryFn: () => boardsApi.get(boardId) })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: key })
    void queryClient.invalidateQueries({ queryKey: ['boards'] })
  }

  const moveMutation = useMutation({
    mutationFn: (vars: { cardId: number; columnId: number; index: number; previous?: Board }) =>
      cardsApi.move(vars.cardId, vars.columnId, vars.index),
    onMutate: () => queryClient.cancelQueries({ queryKey: key }),
    onError: (_error, vars) => {
      if (vars.previous) queryClient.setQueryData(key, vars.previous)
    },
    onSettled: invalidate,
  })

  /**
   * Optimistic move: the cache is updated synchronously, before the request starts,
   * so the card never flashes back to its old place when the drag ends.
   */
  const moveCardTo = (cardId: number, columnId: number, index: number) => {
    const previous = queryClient.getQueryData<Board>(key)
    if (previous) {
      queryClient.setQueryData<Board>(key, {
        ...previous,
        columns: moveCard(previous.columns, cardId, columnId, index),
      })
    }
    moveMutation.mutate({ cardId, columnId, index, previous })
  }

  const createCard = useMutation({
    mutationFn: (vars: { columnId: number; data: CardInput }) =>
      cardsApi.create(vars.columnId, vars.data),
    onSuccess: invalidate,
  })

  const updateCard = useMutation({
    mutationFn: (vars: { cardId: number; data: Partial<CardInput> }) =>
      cardsApi.update(vars.cardId, vars.data),
    onSuccess: invalidate,
  })

  const deleteCard = useMutation({ mutationFn: cardsApi.remove, onSuccess: invalidate })

  const createColumn = useMutation({
    mutationFn: (title: string) => columnsApi.create(boardId, title),
    onSuccess: invalidate,
  })

  const deleteColumn = useMutation({ mutationFn: columnsApi.remove, onSuccess: invalidate })

  return { query, moveCardTo, createCard, updateCard, deleteCard, createColumn, deleteColumn }
}
