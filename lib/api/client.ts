import createClient from "openapi-fetch"
import type { paths } from "./schema"

const configured = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
const origin = new URL(configured)
if (
  !["http:", "https:"].includes(origin.protocol) ||
  origin.pathname !== "/" ||
  origin.search ||
  origin.hash ||
  origin.username ||
  origin.password
)
  throw new Error("NEXT_PUBLIC_API_URL must be an HTTP(S) origin.")
export const API_URL = origin.origin
export const SESSION_EXPIRED = "lunaris:session-expired"
export const SESSION_CHANGED = "lunaris:session-changed"

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
    readonly requestId?: string
  ) {
    super(message)
    this.name = "ApiError"
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error && error.name === "TimeoutError")
    return "The request timed out. Check your connection and retry."
  return "Could not reach Lunaris. Check your connection and try again."
}
export async function apiFetch(request: Request) {
  const response = await fetch(request, {
    credentials: "include",
    cache: "no-store",
    signal: AbortSignal.any([request.signal, AbortSignal.timeout(20_000)]),
  })
  if (
    response.status === 401 &&
    new URL(request.url).pathname.startsWith("/api/v1/") &&
    typeof window !== "undefined"
  )
    window.dispatchEvent(new Event(SESSION_EXPIRED))
  return response
}
export function apiFor(userId: string) {
  return createClient<paths>({
    baseUrl: API_URL,
    credentials: "include",
    headers: { "X-Lunaris-User": userId },
    fetch: apiFetch,
  })
}
export async function unwrap<T>(
  request: Promise<{ data?: T; error?: unknown; response: Response }>
): Promise<T> {
  const { data, error, response } = await request
  if (!response.ok) {
    const detail = error && typeof error === "object" ? error : {}
    if (
      "code" in detail &&
      detail.code === "SESSION_CHANGED" &&
      typeof window !== "undefined"
    )
      window.dispatchEvent(new Event(SESSION_CHANGED))
    throw new ApiError(
      "detail" in detail && typeof detail.detail === "string"
        ? detail.detail
        : "message" in detail && typeof detail.message === "string"
          ? detail.message
          : `Request failed (${response.status}).`,
      response.status,
      "code" in detail && typeof detail.code === "string"
        ? detail.code
        : "REQUEST_FAILED",
      response.headers.get("x-request-id") ?? undefined
    )
  }
  if (data === undefined)
    throw new ApiError(
      "The server returned an empty response.",
      502,
      "INVALID_RESPONSE"
    )
  return data
}
