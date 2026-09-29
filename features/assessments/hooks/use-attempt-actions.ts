"use client"
import { useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, unwrap, ApiError } from "@/lib/api/client"
import { queries, invalidateProgress } from "@/lib/api/queries"
import { useSession } from "@/features/auth/auth-boundary"
import type { IntegrityEvent } from "@/lib/api/types"
type Action =
  | {
      type: "answer"
      questionId: string
      selected: string[]
      responseTimeMs: number
    }
  | { type: "submit" }
  | { type: "event"; event: IntegrityEvent }
export function useAttemptActions(id: string) {
  const { user } = useSession(),
    client = useQueryClient(),
    options = queries.attempt(user.id, id)
  const mutation = useMutation({
    scope: { id: `attempt:${id}` },
    mutationFn: async (action: Action) => {
      await client.cancelQueries({ queryKey: options.queryKey })
      const params = { path: { id } }
      if (action.type === "answer")
        return (
          await unwrap(
            api.PUT("/api/v1/attempts/{id}/answers/{questionId}", {
              params: { path: { id, questionId: action.questionId } },
              body: {
                selected: action.selected,
                responseTimeMs: action.responseTimeMs,
              },
            })
          )
        ).data
      if (action.type === "event")
        return (
          await unwrap(
            api.POST("/api/v1/attempts/{id}/integrity-events", {
              params,
              body: action.event,
              keepalive: true,
            })
          )
        ).data
      return (
        await unwrap(
          api.POST("/api/v1/attempts/{id}/submit", { params, body: {} })
        )
      ).data
    },
    onSuccess: (data) => {
      client.setQueryData(options.queryKey, data)
      if (data.status !== "IN_PROGRESS")
        void invalidateProgress(client, user.id)
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409)
        void client.invalidateQueries({ queryKey: options.queryKey })
    },
  })
  const { mutateAsync } = mutation
  const send = useCallback(
    (action: Action) => mutateAsync(action),
    [mutateAsync]
  )
  return { ...mutation, send }
}
