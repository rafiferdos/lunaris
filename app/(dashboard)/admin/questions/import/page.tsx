import { QuestionImport } from "@/features/assessments/components/question-import"
import { assessmentService } from "@/features/assessments/services/assessment-service"
export const metadata = { title: "Question import" }
export default function Page() {
  return (
    <QuestionImport
      example={[
        ...assessmentService.questions("javascript", "easy").slice(0, 2),
        assessmentService.questions("communication", "medium")[0],
      ]}
    />
  )
}
