import { test } from "node:test"
import assert from "node:assert/strict"
import {
  questionSchema,
  questionImportSchema,
} from "../features/assessments/schemas/question"
import { questions } from "../features/assessments/data/questions"
import {
  reviewAnswer,
  scoreAttempt,
} from "../features/assessments/utils/scoring"
import { assessmentService } from "../features/assessments/services/assessment-service"
import { attemptAvailability } from "../features/assessments/utils/availability"
import { historyService } from "../features/history/history-service"
test("question bank validates every authored record and unique ID", () => {
  assert.equal(questionImportSchema.parse(questions).length, 25)
  assert.equal(new Set(questions.map((q) => q.type)).size, 3)
})
test("import rejects duplicate question IDs, option IDs and ambiguous single answers", () => {
  const q = questions[0]
  assert.equal(questionImportSchema.safeParse([q, q]).success, false)
  assert.equal(
    questionSchema.safeParse({ ...q, options: [q.options[0], q.options[0]] })
      .success,
    false
  )
  assert.equal(
    questionSchema.safeParse({
      ...q,
      options: q.options.map((o) => ({ ...o, correct: true })),
    }).success,
    false
  )
})
test("multi-answer scoring requires the exact answer set and applies configured penalty", () => {
  const q = questions.find((q) => q.type === "multiple")!
  const selected = q.options
    .filter((o) => "correct" in o && o.correct)
    .map((o) => o.id)
  assert.equal(
    reviewAnswer(q, { questionId: q.id, selected, seconds: 8 }, "medium")
      .points,
    2
  )
  assert.equal(
    reviewAnswer(
      q,
      { questionId: q.id, selected: selected.slice(0, 1), seconds: 8 },
      "medium"
    ).points,
    -1
  )
})
test("weighted answers retain quality labels and partial credit", () => {
  const q = questions.find((q) => q.type === "weighted")!
  const review = reviewAnswer(
    q,
    { questionId: q.id, selected: ["2"], seconds: 20 },
    "medium"
  )
  assert.equal(review.quality, "Strong")
  assert.equal(review.points, 4)
  assert.equal(review.maximum, 5)
})
test("skips earn zero and practice does not change rating", () => {
  const topic = assessmentService.getBySlug("javascript")!
  const result = scoreAttempt(
    topic,
    "easy",
    assessmentService.questions(topic.slug, "easy"),
    [],
    100,
    "2026-09-23T10:00:00.000Z"
  )
  assert.equal(result.raw, 0)
  assert.equal(result.ratingChange, 0)
  assert.equal(result.accuracy, 0)
  assert.equal(
    result.reviews.every((r) => r.quality === "Skipped"),
    true
  )
})
test("normalized demo performance stays bounded even with negative raw scores", () => {
  const q = questions[0]
  const review = reviewAnswer(
    q,
    { questionId: q.id, selected: ["1"], seconds: 2 },
    "competitive"
  )
  assert.equal(review.points, -2)
  const topic = assessmentService.getBySlug("javascript")!
  const result = scoreAttempt(topic, "competitive", [q], [review.answer], 100)
  assert.equal(result.raw, -2)
  assert.equal(result.normalized, 0)
})
test("availability uses local calendar days and Monday-based weeks", () => {
  const sample = historyService.listAttempts()[0]
  const now = new Date(2026, 8, 23, 12)
  const yesterday = { ...sample, date: new Date(2026, 8, 22, 12).toISOString() }
  assert.deepEqual(attemptAvailability([yesterday], now), {
    week: 1,
    usedToday: false,
    locked: false,
  })
  const today = { ...sample, date: now.toISOString() }
  assert.equal(attemptAvailability([today], now).locked, true)
  const lastWeek = { ...sample, date: new Date(2026, 8, 20, 12).toISOString() }
  assert.equal(attemptAvailability([lastWeek], now).week, 0)
})
test("weekly maximum locks even without an attempt today", () => {
  const sample = historyService.listAttempts()[0]
  const attempts = Array.from({ length: 7 }, (_, i) => ({
    ...sample,
    id: String(i),
    date: new Date(2026, 8, 22, 10 + i).toISOString(),
  }))
  assert.equal(
    attemptAvailability(attempts, new Date(2026, 8, 23, 12)).locked,
    true
  )
})

import { activitySummary } from "../features/stats/activity"
import { resultInsights } from "../features/assessments/utils/result-insights"
test("activity counts distinct local days and allows yesterday to continue a streak", () => {
  const base = historyService.listAttempts()[0]
  const attempts = [20, 21, 22, 22].map((day, index) => ({
    ...base,
    id: String(index),
    date: new Date(2026, 8, day, 10).toISOString(),
  }))
  const summary = activitySummary(attempts, new Date(2026, 8, 23, 10))
  assert.equal(summary.current, 3)
  assert.equal(summary.longest, 3)
  assert.equal(summary.activeDays, 3)
  assert.equal(activitySummary(attempts, new Date(2026, 8, 24, 10)).current, 0)
})
test("result analysis distinguishes weighted quality from incorrect responses", () => {
  const attempt = historyService
    .listAttempts()
    .find((a) => a.category === "Interpersonal")!
  const insights = resultInsights(attempt)
  assert.equal(insights.incorrect, 0)
  assert.ok(insights.qualities.Strong > 0)
  assert.equal(
    Object.values(insights.qualities).reduce((sum, n) => sum + n, 0),
    attempt.reviews.length
  )
})
