import { Suspense } from "react"
import { HistoryPage } from "@/features/history/history-page"
import Loading from "../loading"
export const metadata = { title: "History" }
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <HistoryPage />
    </Suspense>
  )
}
