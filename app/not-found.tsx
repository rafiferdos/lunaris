import Link from "next/link"
import { EmptyState } from "@/components/shared/ui"
export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl p-8 pt-24">
      <EmptyState
        title="A little off course."
        description="This page doesn’t exist. Find your next step in the assessment library."
      >
        <Link href="/assessments" className="primary-link">
          Back to assessments
        </Link>
      </EmptyState>
    </main>
  )
}
