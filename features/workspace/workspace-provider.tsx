"use client"
import { createContext, useContext, useEffect } from "react"
import { useQueries } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import type { Profile, Preferences } from "@/lib/api/types"
import { QueryState } from "@/components/shared/query-state"
import { applyPreferences } from "@/features/settings/appearance"
import { preferenceSchema } from "@/features/settings/schema"
import { writeLocal } from "@/lib/local-store"
interface Workspace {
  profile: Profile
  preferences: Preferences
}
const Context = createContext<Workspace | null>(null)
export function useWorkspace() {
  const value = useContext(Context)
  if (!value) throw new Error("Workspace provider is required")
  return value
}
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const [profile, preferences] = useQueries({
    queries: [queries.profile(user.id), queries.preferences(user.id)],
  })
  const { setTheme } = useTheme()
  useEffect(() => {
    if (!preferences.data) return
    const p = preferenceSchema.parse({
      ...preferences.data,
      difficulty: preferences.data.difficulty?.toLowerCase(),
    })
    applyPreferences(p)
    try {
      writeLocal("lunaris:preferences", p)
    } catch {}
    setTheme(p.mode)
  }, [preferences.data, setTheme])
  const all = [profile, preferences]
  if (!profile.data || !preferences.data)
    return (
      <QueryState
        error={all.find((q) => q.error)?.error}
        retry={() => Promise.all(all.map((q) => q.refetch()))}
      />
    )
  return (
    <Context
      value={{
        profile: profile.data,
        preferences: preferences.data,
      }}
    >
      {children}
    </Context>
  )
}
