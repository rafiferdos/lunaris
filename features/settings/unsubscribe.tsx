"use client"
import { useSearchParams } from "next/navigation"
import { useMutation } from "@tanstack/react-query"
import { apiOrigin, apiFetch, ApiError } from "@/lib/api/client"
import { Panel } from "@/components/shared/ui"
import { Button } from "@/components/ui/button"
import { MutationError } from "@/components/shared/query-state"
import Link from "@/components/shared/app-link"
export function Unsubscribe() {
  const token = useSearchParams().get("token")
  const mutation = useMutation({
    mutationFn: async () => {
      const url = new URL("/api/notifications/unsubscribe", apiOrigin())
      url.searchParams.set("token", token!)
      const response = await apiFetch(new Request(url, { method: "POST" }))
      if (!response.ok)
        throw new ApiError(
          "This link is invalid or expired. You can turn off emails in Settings.",
          response.status,
          "UNSUBSCRIBE_FAILED"
        )
    },
  })
  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center p-6">
      <Panel className="w-full">
        <h1 className="text-2xl">Email preferences</h1>
        <p className="muted my-5">
          {mutation.isSuccess
            ? "You have unsubscribed from this type of email. You can manage all notifications in Settings."
            : "Unsubscribe from this type of Lunaris email. Your account and progress stay saved."}
        </p>
        {token && !mutation.isSuccess ? (
          <Button
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Updating…" : "Unsubscribe"}
          </Button>
        ) : (
          !token && (
            <p className="muted text-sm">
              This link is missing its unsubscribe token.
            </p>
          )
        )}
        <MutationError error={mutation.error} />
        <Link href="/settings" className="text-link mt-6">
          Manage settings
        </Link>
      </Panel>
    </main>
  )
}
