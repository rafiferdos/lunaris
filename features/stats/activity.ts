import type { GetResponse } from "@/lib/api/types"
export function activitySummary(
  activity: GetResponse<"/api/v1/stats/activity">["data"],
  now = new Date()
) {
  const today = Math.floor(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) /
      86400000
  )
  const completed = new Set(
    activity.days.map((d) => Math.floor(Date.parse(d.date) / 86400000))
  )
  const monday = today - ((now.getUTCDay() + 6) % 7)
  return {
    current: activity.currentStreak,
    longest: activity.longestStreak,
    activeDays: completed.size,
    week: Array.from({ length: 7 }, (_, i) => ({
      label: ["M", "T", "W", "T", "F", "S", "S"][i],
      day: new Date((monday + i) * 86400000).getUTCDate(),
      done: completed.has(monday + i),
      today: monday + i === today,
    })),
  }
}
