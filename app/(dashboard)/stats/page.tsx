import { StatsPage } from "@/features/stats/stats-page"
import { assessmentService } from "@/features/assessments/services/assessment-service"
export const metadata = { title: "My Stats" }
export default function Page() {
  return <StatsPage topics={assessmentService.list()} />
}
