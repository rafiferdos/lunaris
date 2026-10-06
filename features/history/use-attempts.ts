"use client"
import { useQuery } from "@tanstack/react-query"
import { useSession } from "@/features/auth/auth-boundary"

import { queries } from "@/lib/api/queries"
export function useRecentAttempts() {
  const { user } = useSession()
  return useQuery(queries.history(user.id, { limit: 5 }))
}
export function useAvailability() {
  const { user } = useSession()
  const catalog = useQuery(queries.assessments(user.id))
  const quota = catalog.data?.[0]?.availability
  return {
    loaded: !!catalog.data,
    locked: !quota?.canStart,
    week: quota?.weeklyUsed ?? 0,
    usedToday: !!quota?.dailyUsed,
    dailyLimit: quota?.dailyLimit ?? 1,
    weeklyLimit: quota?.weeklyLimit ?? 7,
    nextReset: quota?.nextDailyReset,
  }
}
