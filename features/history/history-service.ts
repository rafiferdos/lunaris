import { assessmentService } from "../assessments/services/assessment-service"
import { scoreAttempt } from "../assessments/utils/scoring"
import type { Attempt } from "../assessments/types/assessment"
const historyTopics = [
  "javascript",
  "react",
  "typescript",
  "communication",
  "nextjs",
  "react",
  "javascript",
  "communication",
  "typescript",
  "react",
  "javascript",
  "communication",
]
export const historyService = {
  listAttempts: (): Attempt[] =>
    historyTopics.map((slug, index) => {
      const topic = assessmentService.getBySlug(slug)!
      const difficulty =
        index % 3 === 0 ? ("medium" as const) : ("easy" as const)
      const questions = assessmentService.questions(slug, difficulty)
      const answers = questions.map((question, i) => ({
        questionId: question.id,
        selected:
          question.type === "weighted"
            ? [i % 3 === 0 ? "2" : "1"]
            : question.options
                .filter((o) => (i === index % 5 ? !o.correct : o.correct))
                .map((o) => o.id)
                .slice(0, question.type === "single" ? 1 : 4),
        seconds: 35 + i * 8,
      }))
      return {
        ...scoreAttempt(
          topic,
          difficulty,
          questions,
          answers,
          98,
          `2026-09-${String([22, 21, 20, 19, 18, 16, 15, 14, 12, 10, 8, 6][index]).padStart(2, "0")}T09:30:00.000Z`
        ),
        id: `history-${index + 1}`,
      }
    }),
}
