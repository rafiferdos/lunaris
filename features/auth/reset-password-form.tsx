"use client"
import { useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import Link from "@/components/shared/app-link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/shared/ui"
import { MutationError } from "@/components/shared/query-state"
import { authenticate } from "./session"
import { announceSession } from "./session-events"
export function ResetPasswordForm() {
  const token = useSearchParams().get("token"),
    router = useRouter(),
    client = useQueryClient()
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: (newPassword: string) =>
      authenticate("reset-password", { token: token!, newPassword }),
    onSuccess: async () => {
      announceSession("signed-out")
      await client.cancelQueries()
      client.clear()
      router.replace("/login?reset=success")
    },
  })
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget),
      password = String(data.get("password") ?? "")
    if (password.length < 12 || password.length > 128) {
      setError("Use 12–128 characters.")
      return
    }
    if (password !== data.get("confirmation")) {
      setError("The passwords must match.")
      return
    }
    setError("")
    mutation.mutate(password)
  }
  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center p-6">
      <Panel className="w-full">
        <h1 className="text-2xl">Choose a new password</h1>
        {token ? (
          <form className="mt-6 space-y-5" onSubmit={submit} noValidate>
            <Label className="field">
              New password
              <Input
                name="password"
                type="password"
                autoComplete="new-password"
                disabled={mutation.isPending}
              />
            </Label>
            <Label className="field">
              Confirm password
              <Input
                name="confirmation"
                type="password"
                autoComplete="new-password"
                disabled={mutation.isPending}
              />
            </Label>
            {error && <p role="alert">{error}</p>}
            <MutationError error={mutation.error} />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Updating…" : "Update password"}
            </Button>
          </form>
        ) : (
          <p className="my-5">
            This link is missing its reset token. Request a fresh link.
          </p>
        )}
        <Link href="/forgot-password" className="text-link mt-6">
          Request another reset link
        </Link>
      </Panel>
    </main>
  )
}
