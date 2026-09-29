"use client"
import { createContext, useContext, useEffect } from "react"
import { useQueries } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { useSession } from "@/features/auth/auth-boundary"
import { queries } from "@/lib/api/queries"
import type {
  Assessment,
  Profile,
  Overview,
  Preferences,
  GetResponse,
} from "@/lib/api/types"
import { QueryState } from "@/components/shared/query-state"
import { applyPreferences } from "@/features/settings/appearance"
import { preferenceSchema } from "@/features/settings/schema"
import { writeLocal } from "@/lib/local-store"
interface Workspace {
  profile: Profile
  assessments: Assessment[]
  overview: Overview
  preferences: Preferences
  activity: GetResponse<"/api/v1/stats/activity">["data"]
}
const Context = createContext<Workspace | null>(null)
export function useWorkspace() {
  const value = useContext(Context)
  if (!value) throw new Error("Workspace provider is required")
  return value
}
export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useSession()
  const [profile, assessments, overview, preferences, activity] = useQueries({
    queries: [
      queries.profile(user.id),
      queries.assessments(user.id),
      queries.overview(user.id),
      queries.preferences(user.id),
      queries.activity(user.id),
    ],
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
  const all = [profile, assessments, overview, preferences, activity]
  if (
    !profile.data ||
    !assessments.data ||
    !overview.data ||
    !preferences.data ||
    !activity.data
  )
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
        assessments: assessments.data,
        overview: overview.data,
        preferences: preferences.data,
        activity: activity.data,
      }}
    >
      {children}
    </Context>
  )
}
