import { z } from "zod"
import { queryOptions } from "@tanstack/react-query"
import { API_URL, apiFetch, ApiError } from "@/lib/api/client"
const sessionSchema = z
  .object({
    user: z.object({
      id: z.string(),
      name: z.string(),
      email: z.email(),
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
      new Request(`${API_URL}/api/auth/get-session`, { signal })
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
  action: "sign-in/email" | "sign-up/email" | "sign-out",
  body:
    { email: string; password: string; name?: string } | Record<string, never>
) {
  const response = await apiFetch(
    new Request(`${API_URL}/api/auth/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
  if (!response.ok) {
    const parsed = z
      .object({ message: z.string().optional(), code: z.string().optional() })
      .safeParse(await response.json())
    throw new ApiError(
      parsed.success
        ? (parsed.data.message ?? "Authentication failed.")
        : "Authentication failed.",
      response.status,
      parsed.success ? (parsed.data.code ?? "AUTH_FAILED") : "AUTH_FAILED"
    )
  }
}
export function safeReturnTo(value: string | null) {
  return value?.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !value.startsWith("/login") &&
    !value.startsWith("/register")
    ? value
    : "/assessments"
}
