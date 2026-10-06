"use client"
import { Button } from "@/components/ui/button"
import "./globals.css"
export default function GlobalError({
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  return (
    <html lang="en">
      <body>
        <main className="mx-auto max-w-xl p-8">
          <h1 className="text-2xl">Unable to open Lunaris</h1>
          <p className="my-4">
            Please try again. Your saved assessments remain on your account.
          </p>
          <Button onClick={retry}>Try again</Button>
        </main>
      </body>
    </html>
  )
}
