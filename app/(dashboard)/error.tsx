"use client"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/shared/ui"
export default function ErrorPage({ retry }: { retry: () => void }) {
  return (
    <EmptyState
      title="This part of your workspace couldn’t load"
      description="Your saved attempts are still on this device. Try loading this page again."
    >
      <Button onClick={retry}>Try again</Button>
    </EmptyState>
  )
}
