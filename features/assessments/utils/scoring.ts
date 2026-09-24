import { levels } from "../data/levels"
import type { Question, Difficulty } from "../schemas/question"
import type { Answer, Attempt, Review, Topic } from "../types/assessment"
// Demonstration scoring only. The API must own all authoritative scoring and limits.
export function reviewAnswer(
  question: Question,
  answer: Answer,
  difficulty: Difficulty
): Review {
  const level = levels[difficulty]
  const maximum = question.type === "weighted" ? level.best : level.correct
  if (!answer.selected.length)
    return { question, answer, quality: "Skipped", points: 0, maximum }
  if (question.type === "weighted") {
    const selected = question.options.find((o) =>
      answer.selected.includes(o.id)
    )
    return {
      question,
      answer,
      quality: selected?.quality ?? "Skipped",
      points: selected ? Math.round(maximum * selected.weight) : 0,
      maximum,
    }
  }
  const correct = question.options.filter((o) => o.correct).map((o) => o.id)
  const matched =
    correct.length === answer.selected.length &&
    correct.every((id) => answer.selected.includes(id))
  return {
    question,
    answer,
    quality: matched ? "Correct" : "Incorrect",
    points: matched ? level.correct : level.wrong,
    maximum,
  }
}
export function scoreAttempt(
  topic: Topic,
  difficulty: Difficulty,
  questions: Question[],
  answers: Answer[],
  integrity: number,
  date = new Date().toISOString()
): Attempt {
  const reviews = questions.map((q) =>
    reviewAnswer(
      q,
      answers.find((a) => a.questionId === q.id) ?? {
        questionId: q.id,
        selected: [],
        seconds: 0,
      },
      difficulty
    )
  )
  const raw = reviews.reduce((sum, r) => sum + r.points, 0),
    maximum = reviews.reduce((sum, r) => sum + r.maximum, 0)
  const performance = Math.round((Math.max(0, raw) / maximum) * 100)
  const accuracy = Math.round(
    (reviews.filter((r) => ["Correct", "Best"].includes(r.quality)).length /
      reviews.length) *
      100
  )
  return {
    id: `attempt-${date.replace(/[^0-9]/g, "")}`,
    topic: topic.slug,
    topicName: topic.name,
    category: topic.category,
    difficulty,
    date,
    raw,
    maximum,
    performance,
    normalized: performance * 10,
    accuracy,
    xp: Math.round((levels[difficulty].xp * performance) / 100),
    ratingChange: levels[difficulty].ranked
      ? Math.round((performance - 60) / 3)
      : 0,
    integrity,
    duration: answers.reduce((sum, a) => sum + a.seconds, 0),
    reviews,
  }
}
