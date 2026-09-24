import { topics } from "../data/topics"
import { questions } from "../data/questions"
import type { Difficulty } from "../schemas/question"
export const assessmentService = {
  list: () => topics,
  getBySlug: (slug: string) => topics.find((topic) => topic.slug === slug),
  questions: (slug: string, difficulty: Difficulty) =>
    questions
      .filter((q) => q.topic === slug && q.active)
      .map((q) => ({ ...q, difficulty })),
}
