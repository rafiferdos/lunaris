import type { Attempt } from "../types/assessment"
import { attemptLimits } from "../data/levels"
export function attemptAvailability(attempts: Attempt[], now = new Date()) {
  const localDay = (date: Date) =>
    `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
  const today = localDay(now)
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7))
  const week = attempts.filter(
    (a) => new Date(a.date) >= start && new Date(a.date) <= now
  ).length
  const usedToday = attempts.some((a) => localDay(new Date(a.date)) === today)
  return { week, usedToday, locked: usedToday || week >= attemptLimits.weekly }
}
