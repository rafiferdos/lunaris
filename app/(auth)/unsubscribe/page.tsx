import { Suspense } from "react"
import { Unsubscribe } from "@/features/settings/unsubscribe"
export const metadata = { title: "Email Preferences", referrer: "no-referrer" }
export default function Page() {
  return (
    <Suspense fallback={<p>Loading email preferences…</p>}>
      <Unsubscribe />
    </Suspense>
  )
}
