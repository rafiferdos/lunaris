"use client"
import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { apiOrigin, SESSION_EXPIRED } from "@/lib/api/client"
import { useSession } from "@/features/auth/auth-boundary"
import { privateKey } from "@/lib/api/queries"
export function useLiveLeaderboard(onRefresh: () => void) {
  const { user } = useSession(),
    client = useQueryClient(),
    [connected, setConnected] = useState(false)
  useEffect(() => {
    const stream = new EventSource(
      `${apiOrigin()}/api/v1/leaderboards/stream`,
      {
        withCredentials: true,
      }
    )
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = () => {
      clearTimeout(timer)
      timer = setTimeout(() => {
        onRefresh()
        void client.invalidateQueries({
          queryKey: privateKey(user.id),
          predicate: (q) =>
            q.queryKey[2] === "rankings" || q.queryKey[2] === "overview",
        })
      }, 200)
    }
    const open = () => {
      setConnected(true)
      refresh()
    }
    stream.addEventListener("connected", open)
    stream.addEventListener("leaderboard.updated", refresh)
    stream.addEventListener("session.expired", () => {
      stream.close()
      window.dispatchEvent(new Event(SESSION_EXPIRED))
    })
    stream.onerror = () => setConnected(false)
    return () => {
      clearTimeout(timer)
      stream.close()
    }
  }, [user.id, client, onRefresh])
  return connected
}
