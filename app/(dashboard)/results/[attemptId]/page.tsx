import { Results } from "@/features/assessments/components/results"
export const metadata = { title: "Assessment results" }
export default async function Page({
  params,
}: {
  params: Promise<{ attemptId: string }>
}) {
  const { attemptId } = await params
  return <Results attemptId={attemptId} />
}
