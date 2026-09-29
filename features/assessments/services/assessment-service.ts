import type { Assessment, Mode } from "@/lib/api/types"
import type { Topic } from "../types/assessment"
import { topicVisuals } from "../data/topic-visuals"
export const modeLabels: Record<Mode, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  COMPETITIVE: "Competitive",
}
export function topicView(assessment: Assessment): Topic {
  const visual = topicVisuals[assessment.slug]
  return {
    slug: assessment.slug,
    name: assessment.name,
    description: assessment.description,
    category:
      assessment.category === "TECHNICAL" ? "Technical" : "Interpersonal",
    monogram: visual?.monogram ?? assessment.name.slice(0, 2),
    accent: visual?.accent ?? "neutral",
    mastery: Math.round(assessment.progress?.averageNormalizedScore ?? 0),
    available: assessment.modes.some((m) => m.available),
  }
}
