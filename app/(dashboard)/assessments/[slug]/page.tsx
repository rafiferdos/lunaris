import { TopicDetail } from "@/features/assessments/components/topic-detail"
export const metadata = { title: "Assessment details" }
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <TopicDetail slug={slug} />
}
