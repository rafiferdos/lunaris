import { Suspense } from "react"
import { Discovery } from "@/features/assessments/components/discovery"
import Loading from "../loading"
export const metadata = { title: "Assessments" }
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Discovery />
    </Suspense>
  )
}
