import type { Difficulty, Question } from "../schemas/question"
export type Category = "Technical" | "Interpersonal"
export interface Topic {
  slug: string
  name: string
  monogram: string
  category: Category
  description: string
  mastery: number
  accent: "amber" | "blue" | "mint" | "rose" | "neutral"
  available: boolean
}
export interface Answer {
  questionId: string
  selected: string[]
  seconds: number
}
export interface Review {
  question: Question
  answer: Answer
  quality: string
  points: number
  maximum: number
}
export interface Attempt {
  id: string
  topic: string
  topicName: string
  category: Category
  difficulty: Difficulty
  date: string
  raw: number
  maximum: number
  performance: number
  normalized: number
  accuracy: number
  xp: number
  ratingChange: number
  integrity: number
  duration: number
  reviews: Review[]
}
export interface LevelConfig {
  name: string
  description: string
  correct: number
  best: number
  wrong: number
  xp: number
  seconds: number
  previous: boolean
  ranked: boolean
  integrity: string
}
