"use client"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "@/features/auth/auth-boundary"
import { useWorkspace } from "@/features/workspace/workspace-provider"
import { queries } from "@/lib/api/queries"
export function useRecentAttempts() {
  const { user } = useSession()
  return useQuery(queries.history(user.id, { limit: 5 }))
}
export function useAvailability() {
  const { assessments } = useWorkspace()
  const quota = assessments[0]?.availability
  return {
    locked: !quota?.canStart,
    week: quota?.weeklyUsed ?? 0,
    usedToday: !!quota?.dailyUsed,
    dailyLimit: quota?.dailyLimit ?? 1,
    weeklyLimit: quota?.weeklyLimit ?? 7,
    nextReset: quota?.nextDailyReset,
  }
}
