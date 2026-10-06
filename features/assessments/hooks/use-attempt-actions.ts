"use client"
import { useCallback } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFor, unwrap, ApiError } from "@/lib/api/client"
import { queries, invalidateProgress } from "@/lib/api/queries"
import { useSession } from "@/features/auth/auth-boundary"
import type { IntegrityEvent, ServerAttempt } from "@/lib/api/types"
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
  const reconcile = (data: ServerAttempt) => {
    client.setQueryData(options.queryKey, (current) => {
      if (
        current?.status !== "IN_PROGRESS" &&
        current?.result &&
        data.status === "IN_PROGRESS"
      )
        return current
      if (
        current &&
        Date.parse(current.serverTime) > Date.parse(data.serverTime)
      )
        return current
      return data
    })
    if (data.status !== "IN_PROGRESS") void invalidateProgress(client, user.id)
  }
  const onError = (error: Error) => {
    if (error instanceof ApiError && error.status === 409)
      void client.invalidateQueries({ queryKey: options.queryKey })
  }
  const events = useMutation({
    networkMode: "always",
    mutationFn: async (event: IntegrityEvent) => {
      await client.cancelQueries({ queryKey: options.queryKey })
      return (
        await unwrap(
          apiFor(user.id).POST("/api/v1/attempts/{id}/integrity-events", {
            params: { path: { id } },
            body: event,
            keepalive: true,
          })
        )
      ).data
    },
    onSuccess: reconcile,
    onError,
  })
  const mutation = useMutation({
    networkMode: "always",
    scope: { id: `attempt:${id}` },
    mutationFn: async (action: Exclude<Action, { type: "event" }>) => {
      await client.cancelQueries({ queryKey: options.queryKey })
      const params = { path: { id } }
      if (action.type === "answer")
        return (
          await unwrap(
            apiFor(user.id).PUT("/api/v1/attempts/{id}/answers/{questionId}", {
              params: { path: { id, questionId: action.questionId } },
              body: {
                selected: action.selected,
                responseTimeMs: action.responseTimeMs,
              },
            })
          )
        ).data
      return (
        await unwrap(
          apiFor(user.id).POST("/api/v1/attempts/{id}/submit", {
            params,
            body: {},
          })
        )
      ).data
    },
    onSuccess: reconcile,
    onError,
  })
  const { mutateAsync } = mutation
  const sendSignal = events.mutateAsync
  const send = useCallback(
    (action: Action) =>
      action.type === "event" ? sendSignal(action.event) : mutateAsync(action),
    [mutateAsync, sendSignal]
  )
  return { ...mutation, send }
}
