"use client"
import { z } from "zod"
import { useLocalValue, readLocal, writeLocal } from "@/lib/local-store"
import { historyService } from "./history-service"
import type { Attempt } from "../assessments/types/assessment"
import {
  questionSchema,
  difficultySchema,
} from "../assessments/schemas/question"
const attemptSchema = z.object({
  id: z.string(),
  topic: z.string(),
  topicName: z.string(),
  category: z.enum(["Technical", "Interpersonal"]),
  difficulty: difficultySchema,
  date: z.iso.datetime(),
  raw: z.number(),
  maximum: z.number().positive(),
  performance: z.number(),
  normalized: z.number(),
  accuracy: z.number(),
  xp: z.number(),
  ratingChange: z.number(),
  integrity: z.number(),
  duration: z.number(),
  reviews: z.array(
    z.object({
      question: questionSchema,
      answer: z.object({
        questionId: z.string(),
        selected: z.array(z.string()),
        seconds: z.number(),
      }),
      quality: z.string(),
      points: z.number(),
      maximum: z.number(),
    })
  ),
})
const storedSchema = z.array(attemptSchema)
const baseline = historyService.listAttempts()
const empty: Attempt[] = []
export function useAttempts() {
  const saved = useLocalValue("lunaris:attempts", empty, (v) =>
    storedSchema.parse(v)
  )
  return [...saved, ...baseline]
}
export function saveAttempt(attempt: Attempt) {
  const raw = readLocal("lunaris:attempts")
  let previous: Attempt[] = []
  try {
    previous = storedSchema.parse(JSON.parse(raw ?? "[]"))
  } catch {}
  writeLocal(
    "lunaris:attempts",
    [attempt, ...previous.filter((a) => a.id !== attempt.id)].slice(0, 100)
  )
}
export { attemptAvailability } from "../assessments/utils/availability"
