import { z } from "zod"
import { queryOptions } from "@tanstack/react-query"
import {
  apiOrigin,
  apiFetch,
  ApiError,
  SESSION_CHANGED,
} from "@/lib/api/client"
const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
      emailVerified: z.boolean().default(false),
      role: z.enum(["USER", "ADMIN"]).default("USER"),
    }),
    session: z.object({ expiresAt: z.string() }),
  })
  .nullable()
export type Session = NonNullable<z.infer<typeof sessionSchema>>
export const sessionOptions = queryOptions({
  queryKey: ["session"],
  queryFn: async ({ signal }) => {
    const response = await apiFetch(
      new Request(`${apiOrigin()}/api/auth/get-session`, { signal })
    )
    if (!response.ok)
      throw new ApiError(
        "Your session could not be checked.",
        response.status,
        "SESSION_CHECK_FAILED"
      )
    return sessionSchema.parse(await response.json())
  },
  staleTime: 30_000,
  retry: false,
})
export async function authenticate(
  action:
    | "sign-in/email"
    | "sign-up/email"
    | "sign-out"
    | "request-password-reset"
    | "reset-password"
    | "send-verification-email",
  body:
    | { email: string; password: string; name?: string }
    | { email: string; redirectTo: string }
    | { token: string; newPassword: string }
    | { email: string; callbackURL: string }
    | Record<string, never>,
  expectedUserId?: string
) {
  const response = await apiFetch(
    new Request(`${apiOrigin()}/api/auth/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(expectedUserId ? { "X-Lunaris-User": expectedUserId } : {}),
      },
      body: JSON.stringify(body),
    })
  )
  if (!response.ok) {
    const parsed = z
      .object({ message: z.string().optional(), code: z.string().optional() })
      .safeParse(await response.json())
    if (
      parsed.success &&
      parsed.data.code === "SESSION_CHANGED" &&
      typeof window !== "undefined"
    )
      window.dispatchEvent(new Event(SESSION_CHANGED))
    throw new ApiError(
      parsed.success
        ? (parsed.data.message ?? "Authentication failed.")
        : "Authentication failed.",
      response.status,
      parsed.success ? (parsed.data.code ?? "AUTH_FAILED") : "AUTH_FAILED"
    )
  }
}
export const capabilitiesOptions = queryOptions({
  queryKey: ["capabilities"],
  queryFn: async ({ signal }) => {
    const response = await apiFetch(
      new Request(`${apiOrigin()}/api/capabilities`, { signal })
    )
    if (!response.ok)
      throw new ApiError(
        "Could not check account recovery availability.",
        response.status,
        "CAPABILITIES_FAILED"
      )
    return z
      .object({
        passwordReset: z.boolean(),
        emailVerification: z.boolean().default(false),
        notifications: z.boolean().default(false),
      })
      .parse(await response.json())
  },
  staleTime: 60_000,
})
export function safeReturnTo(value: string | null) {
  if (!value?.startsWith("/") || /[\x00-\x20\\]/.test(value))
    return "/assessments"
  try {
    const url = new URL(value, "https://lunaris.invalid")
    if (
      url.origin !== "https://lunaris.invalid" ||
      /^\/(login|register|reset-password|forgot-password)(\/|$)/.test(
        url.pathname
      )
    )
      return "/assessments"
    return url.pathname + url.search + url.hash
  } catch {
    return "/assessments"
  }
}
