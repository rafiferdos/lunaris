"use client"
import { useEffect } from "react"
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { ApiError, SESSION_EXPIRED } from "@/lib/api/client"
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
    const clear = () => {
      void client.cancelQueries()
      client.clear()
      client.setQueryData(["session"], null)
      router.replace("/login")
    }
    window.addEventListener(SESSION_EXPIRED, clear)
    const channel =
      typeof BroadcastChannel === "undefined"
        ? null
        : new BroadcastChannel("lunaris-session")
    if (channel) channel.onmessage = () => clear()
    return () => {
      window.removeEventListener(SESSION_EXPIRED, clear)
      channel?.close()
    }
  }, [client, router])
  return null
}
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={getClient()}>
      <SessionEvents />
      {children}
    </QueryClientProvider>
  )
}
