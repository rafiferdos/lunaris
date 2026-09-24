import type { Difficulty } from "../schemas/question"
import type { LevelConfig } from "../types/assessment"
export const levels: Record<Difficulty, LevelConfig> = {
  easy: {
    name: "Easy",
    description: "Build a strong foundation.",
    correct: 1,
    best: 1,
    wrong: 0,
    xp: 20,
    seconds: 600,
    previous: true,
    ranked: false,
    integrity: "Basic session checks",
  },
  medium: {
    name: "Medium",
    description: "Put your understanding to work.",
    correct: 2,
    best: 5,
    wrong: -1,
    xp: 40,
    seconds: 480,
    previous: true,
    ranked: true,
    integrity: "Optional focus monitoring",
  },
  competitive: {
    name: "Competitive",
    description: "Make every decision count.",
    correct: 3,
    best: 7,
    wrong: -2,
    xp: 60,
    seconds: 360,
    previous: false,
    ranked: true,
    integrity: "Fullscreen & focus monitoring",
  },
}
export const attemptLimits = { daily: 1, weekly: 7, violationThreshold: 3 }
