"use client"
import { useEffect } from "react"
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ApiError, SESSION_EXPIRED, SESSION_CHANGED } from "@/lib/api/client"
import { sessionOptions } from "@/features/auth/session"
import { SESSION_CHANNEL } from "@/features/auth/session-events"
import { NavigationGuardProvider } from "@/components/shared/navigation-guard"
import { MotionProvider } from "@/components/shared/motion"
let browserClient: QueryClient | undefined
function getClient() {
  if (typeof window === "undefined") return createClient()
  return (browserClient ??= createClient())
}
function createClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) =>
          !(error instanceof ApiError && error.status < 500) && count < 2,
      },
      mutations: { retry: false },
    },
  })
}
function SessionEvents() {
  const client = useQueryClient(),
    router = useRouter()
  useEffect(() => {
    let refreshing = false
    const clear = () => {
      void client.cancelQueries()
      client.clear()
      client.setQueryData(["session"], null)
      router.replace("/login")
    }
    window.addEventListener(SESSION_EXPIRED, clear)
    const changed = async () => {
      if (refreshing) return
      refreshing = true
      try {
        await client.cancelQueries()
        client.clear()
        await client.fetchQuery(sessionOptions)
        router.replace("/assessments")
      } catch {
        clear()
      } finally {
        refreshing = false
      }
    }
    const onChange = () => {
      void changed()
    }
    window.addEventListener(SESSION_CHANGED, onChange)
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel(SESSION_CHANNEL)
    const receive = (message: unknown) => {
      if (message === "signed-out") clear()
      if (message === "changed") onChange()
    }
    if (channel) channel.onmessage = (event) => receive(event.data)
    const storage = (event: StorageEvent) => {
      if (!channel && event.key === SESSION_CHANNEL && event.newValue) {
        try {
          receive(JSON.parse(event.newValue).message)
        } catch {}
      }
    }
    window.addEventListener("storage", storage)
    return () => {
      window.removeEventListener(SESSION_EXPIRED, clear)
      window.removeEventListener(SESSION_CHANGED, onChange)
      window.removeEventListener("storage", storage)
      channel?.close()
    }
  }, [client, router])
  return null
}
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getClient()}>
      <SessionEvents />
      <MotionProvider>
        <NavigationGuardProvider>{children}</NavigationGuardProvider>
      </MotionProvider>
    </QueryClientProvider>
  )
}
