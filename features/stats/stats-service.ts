import { activitySummary } from "./activity"
import type { Attempt } from "@/features/assessments/types/assessment"
import { userBaseline } from "@/features/profile/profile-service"
export const statsService = {
  getOverview: (attempts: Attempt[]) => {
    const added = attempts.filter((a) => a.id.startsWith("attempt-"))
    const mean = (values: number[]) =>
      Math.round(
        values.reduce((sum, value) => sum + value, 0) /
          Math.max(1, values.length)
      )
    return {
      activity: activitySummary(attempts),
      rating:
        userBaseline.rating + added.reduce((sum, a) => sum + a.ratingChange, 0),
      xp: userBaseline.xp + added.reduce((sum, a) => sum + a.xp, 0),
      completed: attempts.length,
      questions: attempts.reduce((sum, a) => sum + a.reviews.length, 0),
      accuracy: mean(attempts.map((a) => a.accuracy)),
      performance: mean(attempts.map((a) => a.performance)),
      integrity: mean(attempts.map((a) => a.integrity)),
      responseTime: mean(
        attempts.flatMap((a) => a.reviews.map((r) => r.answer.seconds))
      ),
      technical: mean(
        attempts
          .filter((a) => a.category === "Technical")
          .map((a) => a.performance)
      ),
      interpersonal: mean(
        attempts
          .filter((a) => a.category === "Interpersonal")
          .map((a) => a.performance)
      ),
    }
  },
  ratingHistory: [
    { label: "Jun 1", value: 1190 },
    { label: "Jun 15", value: 1240 },
    { label: "Jul 1", value: 1285 },
    { label: "Jul 15", value: 1260 },
    { label: "Aug 1", value: 1360 },
    { label: "Aug 15", value: 1388 },
    { label: "Sep 1", value: 1419 },
    { label: "Sep 23", value: 1483 },
  ],
}
