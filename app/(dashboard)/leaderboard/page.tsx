import { Suspense } from "react"
import { LeaderboardPage } from "@/features/leaderboard/leaderboard-page"
import Loading from "../loading"
export const metadata = { title: "Leaderboard" }
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <LeaderboardPage />
    </Suspense>
  )
}
