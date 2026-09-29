"use client"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { errorMessage } from "@/lib/api/client"
export function QueryState({
  error,
  retry,
  label = "Loading your workspace",
}: {
  error?: unknown
  retry?: () => unknown
  label?: string
}) {
  if (error)
    return (
      <Alert role="alert">
        <AlertTitle>Unable to load this view</AlertTitle>
        <AlertDescription>{errorMessage(error)}</AlertDescription>
        {retry && (
          <Button
            className="mt-4"
            variant="outline"
            onClick={() => void retry()}
          >
            Try again
          </Button>
        )}
      </Alert>
    )
  return (
    <div role="status" aria-label={label} className="space-y-4 p-6">
      <span className="sr-only">{label}</span>
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}
export function MutationError({ error }: { error: unknown }) {
  return error ? (
    <Alert variant="destructive" role="alert">
      <AlertDescription>{errorMessage(error)}</AlertDescription>
    </Alert>
  ) : null
}
