"use client"
import { createContext, useContext, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { sessionOptions, authenticate, type Session } from "./session"
import { QueryState } from "@/components/shared/query-state"
const SessionContext = createContext<Session | null>(null)
export function useSession() {
  const session = useContext(SessionContext)
  if (!session) throw new Error("Session provider is required")
  return session
}
export function AuthBoundary({ children }: { children: React.ReactNode }) {
  const query = useQuery(sessionOptions),
    router = useRouter(),
    pathname = usePathname()
  useEffect(() => {
    if (query.data === null)
      router.replace(
        `/login?next=${encodeURIComponent(pathname + window.location.search)}`
      )
  }, [query.data, router, pathname])
  if (!query.data)
    return (
      <QueryState
        error={query.error}
        retry={query.refetch}
        label="Checking your session"
      />
    )
  return <SessionContext value={query.data}>{children}</SessionContext>
}
export function useSignOut() {
  const client = useQueryClient(),
    router = useRouter()
  return useMutation({
    mutationFn: () => authenticate("sign-out", {}),
    onSuccess: async () => {
      await client.cancelQueries()
      client.clear()
      client.setQueryData(["session"], null)
      if (typeof BroadcastChannel !== "undefined") {
        const channel = new BroadcastChannel("lunaris-session")
        channel.postMessage("signed-out")
        channel.close()
      }
      router.replace("/login")
    },
  })
}
