import { Quiz } from "@/features/assessments/components/quiz"
import { Suspense } from "react"
import { QueryState } from "@/components/shared/query-state"
export const metadata = { title: "Assessment session" }
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <Suspense fallback={<QueryState />}>
      <Quiz slug={slug} />
    </Suspense>
  )
}
