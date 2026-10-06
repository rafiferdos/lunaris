"use client"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
export default function ErrorPage({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <main className="mx-auto max-w-xl p-8">
      <Alert variant="destructive">
        <AlertTitle>This page could not be displayed</AlertTitle>
        <AlertDescription>
          Your saved work is still on your account. Try loading the page again.
        </AlertDescription>
      </Alert>
      <Button className="mt-4" onClick={retry}>
        Try again
      </Button>
    </main>
  )
}
