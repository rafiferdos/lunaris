import { notFound } from "next/navigation"
import { assessmentService } from "@/features/assessments/services/assessment-service"
import { TopicDetail } from "@/features/assessments/components/topic-detail"
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return {
    title: assessmentService.getBySlug(slug)?.name ?? "Assessment not found",
  }
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const topic = assessmentService.getBySlug(slug)
  if (!topic) notFound()
  return (
    <TopicDetail
      topic={topic}
      count={assessmentService.questions(slug, "easy").length}
    />
  )
}
