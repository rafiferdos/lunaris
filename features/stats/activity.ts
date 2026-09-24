import type { Attempt } from "@/features/assessments/types/assessment"
const dayNumber = (date: Date) =>
  Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000
  )
export function activitySummary(attempts: Attempt[], now = new Date()) {
  const days = [
    ...new Set(attempts.map((a) => dayNumber(new Date(a.date)))),
  ].sort((a, b) => a - b)
  const today = dayNumber(now)
  let longest = 0,
    run = 0,
    previous = -1
  for (const day of days) {
    run = day === previous + 1 ? run + 1 : 1
    longest = Math.max(longest, run)
    previous = day
  }
  const completed = new Set(days)
  let cursor = completed.has(today) ? today : today - 1,
    current = 0
  while (completed.has(cursor)) {
    current++
    cursor--
  }
  const monday = today - ((now.getDay() + 6) % 7)
  const week = Array.from({ length: 7 }, (_, index) => ({
    label: ["M", "T", "W", "T", "F", "S", "S"][index],
    day: new Date((monday + index) * 86400000).getUTCDate(),
    done: completed.has(monday + index),
    today: monday + index === today,
  }))
  return { current, longest, activeDays: days.length, week }
}
