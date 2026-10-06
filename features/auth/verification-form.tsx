"use client"
import { useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { z } from "zod"
import { authenticate, capabilitiesOptions } from "./session"
import { Panel } from "@/components/shared/ui"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { MutationError } from "@/components/shared/query-state"
import Link from "@/components/shared/app-link"

export function VerificationForm() {
  const capabilities = useQuery(capabilitiesOptions)
  const [error, setError] = useState("")
  const mutation = useMutation({
    mutationFn: (email: string) =>
      authenticate("send-verification-email", {
        email,
        callbackURL: `${window.location.origin}/login?verified=success`,
      }),
  })
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const email = z
      .email()
      .safeParse(new FormData(event.currentTarget).get("email"))
    if (!email.success) {
      setError("Enter a valid email address.")
      return
    }
    setError("")
    mutation.mutate(email.data)
  }
  return (
    <main className="mx-auto flex min-h-svh max-w-lg items-center p-6">
      <Panel className="w-full">
        <h1 className="text-2xl">Verify your email</h1>
        <p className="muted mt-3 text-sm">
          Use the verification link in your inbox to finish setting up your
          account.
        </p>
        {capabilities.data?.emailVerification ? (
          <form onSubmit={submit} noValidate className="mt-6 space-y-5">
            <Label className="field">
              Email address
              <Input
                name="email"
                type="email"
                autoComplete="email"
                disabled={mutation.isPending}
              />
            </Label>
            {error && <p role="alert">{error}</p>}
            <MutationError error={mutation.error} />
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Sending…" : "Send verification link"}
            </Button>
            {mutation.isSuccess && (
              <p role="status" className="muted text-sm">
                If this account needs verification, a fresh link will arrive
                shortly.
              </p>
            )}
          </form>
        ) : (
          <p className="muted mt-6 text-sm">
            {capabilities.isPending
              ? "Checking availability…"
              : capabilities.isError
                ? "Availability could not be checked. Try again shortly."
                : "Email verification is not configured. You can sign in without it."}
          </p>
        )}
        <MutationError error={capabilities.error} />
        <Link href="/login" className="text-link mt-6">
          Back to sign in
        </Link>
      </Panel>
    </main>
  )
}
