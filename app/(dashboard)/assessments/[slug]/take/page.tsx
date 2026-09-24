import { notFound } from "next/navigation"
import { assessmentService } from "@/features/assessments/services/assessment-service"
import { difficultySchema } from "@/features/assessments/schemas/question"
import { Quiz } from "@/features/assessments/components/quiz"
export const metadata = { title: "Assessment session" }
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ level?: string }>
}) {
  const { slug } = await params
  const { level } = await searchParams
  const topic = assessmentService.getBySlug(slug)
  if (!topic?.available) notFound()
  const parsed = difficultySchema.safeParse(level ?? "easy")
  if (!parsed.success) notFound()
  return (
    <Quiz
      topic={topic}
      difficulty={parsed.data}
      questions={assessmentService.questions(slug, parsed.data)}
    />
  )
}
