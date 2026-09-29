"use client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { authenticate, sessionOptions, safeReturnTo } from "./session"
import { MutationError } from "@/components/shared/query-state"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { Orbit, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
const authSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(12, "Use at least 12 characters.").max(128),
  name: z.string().min(2, "Enter your name.").optional(),
})
export function AuthForm({
  mode,
}: {
  mode: "login" | "register" | "forgot-password"
}) {
  const router = useRouter()
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: (body: { email: string; password: string; name?: string }) =>
      authenticate(
        mode === "register" ? "sign-up/email" : "sign-in/email",
        body
      ),
    onSuccess: async () => {
      await client.cancelQueries()
      client.clear()
      await client.fetchQuery(sessionOptions)
      router.replace(
        safeReturnTo(new URLSearchParams(window.location.search).get("next"))
      )
    },
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [message, setMessage] = useState("")
  const forgot = mode === "forgot-password",
    register = mode === "register"
  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = new FormData(event.currentTarget)
    const parsed = (
      forgot ? authSchema.pick({ email: true }) : authSchema
    ).safeParse({
      email: values.get("email"),
      password: values.get("password"),
      ...(register ? { name: values.get("name") } : {}),
    })
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            issue.path.join("."),
            issue.message,
          ])
        )
      )
      return
    }
    setErrors({})
    if (forgot) {
      setMessage(
        "Password recovery is not available yet. Contact your workspace administrator for help."
      )
      return
    }
    if (!forgot)
      mutation.mutate(
        authSchema.parse({
          email: values.get("email"),
          password: values.get("password"),
          ...(register ? { name: values.get("name") } : {}),
        })
      )
  }
  return (
    <div className="auth-layout">
      <aside className="auth-art">
        <Link href="/login" className="brand">
          <Orbit size={30} />
          lunaris.
        </Link>
        <div className="auth-statement">
          <svg className="orbital-art" viewBox="0 0 230 170" aria-hidden="true">
            <ellipse
              cx="115"
              cy="85"
              rx="108"
              ry="44"
              transform="rotate(-30 115 85)"
              fill="none"
              stroke="var(--border)"
            />
            <ellipse
              cx="115"
              cy="85"
              rx="77"
              ry="31"
              transform="rotate(-30 115 85)"
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth=".6"
            />
            <circle cx="115" cy="85" r="24" fill="var(--muted)" />
            <circle cx="189" cy="33" r="5" fill="var(--foreground)" />
          </svg>
          <p className="eyebrow">MAKE PROGRESS, WITH PURPOSE</p>
          <h1>
            Know where you are.
            <br />
            See where you
            <br />
            could go.
          </h1>
          <p>
            Thoughtful assessments. Meaningful insights.
            <br />A little more confidence in what comes next.
          </p>
        </div>
        <p className="muted text-xs">
          © 2026 Lunaris · Built around your progress.
        </p>
      </aside>
      <main className="auth-form-side">
        <div className="auth-form">
          <Link href="/login" className="brand">
            <Orbit size={24} />
            lunaris.
          </Link>
          <h1>
            {forgot
              ? "A fresh start."
              : register
                ? "Make room for progress."
                : "Good to see you."}
          </h1>
          <p className="muted mt-3 text-sm">
            {forgot
              ? "Contact your administrator if you cannot access your account."
              : register
                ? "Create your workspace and start with what matters."
                : "Sign in to your personal workspace."}
          </p>
          <form onSubmit={submit} noValidate>
            {register && (
              <AuthField label="Full name" name="name" error={errors.name} />
            )}
            <AuthField
              label="Email address"
              name="email"
              type="email"
              error={errors.email}
            />
            {!forgot && (
              <AuthField
                label="Password"
                name="password"
                type="password"
                error={errors.password}
              />
            )}{" "}
            {!forgot && !register && (
              <Link href="/forgot-password" className="text-right text-xs">
                Forgot password?
              </Link>
            )}
            <MutationError error={mutation.error} />
            <Button type="submit" size="lg" disabled={mutation.isPending}>
              {forgot
                ? "Recovery information"
                : register
                  ? "Create account"
                  : "Sign in"}
              <ArrowRight />
            </Button>
          </form>
          {message && (
            <p role="status" className="form-message mt-5">
              {message}
            </p>
          )}
          <p className="muted mt-6 text-center text-xs">
            {forgot ? (
              <Link href="/login">Back to sign in</Link>
            ) : register ? (
              <>
                Already have an account?{" "}
                <Link href="/login" className="text-foreground">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to Lunaris?{" "}
                <Link href="/register" className="text-foreground">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
function AuthField({
  label,
  name,
  type = "text",
  error,
}: {
  label: string
  name: string
  type?: string
  error?: string
}) {
  return (
    <Label className="field">
      {label}
      <Input
        name={name}
        type={type}
        autoComplete={name === "password" ? "current-password" : name}
        placeholder={name === "email" ? "you@example.com" : undefined}
        aria-invalid={!!error}
        aria-describedby={error ? `auth-${name}` : undefined}
      />
      {error && (
        <span id={`auth-${name}`} className="field-error" role="alert">
          {error}
        </span>
      )}
    </Label>
  )
}
