import type { Attempt } from "../types/assessment"
export function resultInsights(attempt: Attempt) {
  const qualities = attempt.reviews.reduce<Record<string, number>>(
    (counts, review) => ({
      ...counts,
      [review.quality]: (counts[review.quality] ?? 0) + 1,
    }),
    {}
  )
  const responseTimes = attempt.reviews.map((review) => review.answer.seconds)
  const answeredTimes = attempt.reviews
    .filter((review) => review.answer.selected.length > 0)
    .map((review) => review.answer.seconds)
  const ranked = [...attempt.reviews].sort(
    (a, b) => b.points / b.maximum - a.points / a.maximum
  )
  return {
    qualities,
    responseTimes,
    average: answeredTimes.length
      ? Math.round(
          answeredTimes.reduce((sum, seconds) => sum + seconds, 0) /
            answeredTimes.length
        )
      : 0,
    fastest: answeredTimes.length ? Math.min(...answeredTimes) : 0,
    correct: (qualities.Correct ?? 0) + (qualities.Best ?? 0),
    incorrect: qualities.Incorrect ?? 0,
    skipped: qualities.Skipped ?? 0,
    best: qualities.Best ?? 0,
    strongest: ranked[0],
    weakest: ranked.at(-1),
    perfect: attempt.performance === 100,
  }
}
