import { test } from "node:test"
import assert from "node:assert/strict"
import { safeReturnTo } from "../features/auth/session"
import { remainingSeconds } from "../features/assessments/hooks/use-countdown"
import { getStartRequestKey } from "../features/assessments/hooks/start-request"
import {
  importDocumentSchema,
  importExample,
} from "../features/admin/import-schema"
import { ApiError, unwrap, apiFetch } from "../lib/api/client"
import { percent } from "../lib/format"
test("return navigation rejects external and protocol-relative destinations", () => {
  for (const url of [
    "https://evil.example",
    "//evil.example",
    "/\\evil.example",
    "/login",
    "/\n/evil.example",
    "/\t/evil.example",
    "/reset-password?token=secret",
  ])
    assert.equal(safeReturnTo(url), "/assessments")
  assert.equal(safeReturnTo("/history?topic=react"), "/history?topic=react")
})
test("start retries retain a single idempotency key", () => {
  const data = new Map<string, string>()
  const storage = {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      data.set(k, v)
    },
  }
  assert.equal(
    getStartRequestKey("a", storage, () => "first"),
    "first"
  )
  assert.equal(
    getStartRequestKey("a", storage, () => "second"),
    "first"
  )
  assert.equal(
    getStartRequestKey("b", storage, () => "other"),
    "other"
  )
})
test("countdown uses server clock offset and clamps at expiry", () => {
  assert.equal(
    remainingSeconds(
      "2026-09-28T10:01:00Z",
      "2026-09-28T10:00:00Z",
      1000,
      11000
    ),
    50
  )
  assert.equal(
    remainingSeconds(
      "2026-09-28T10:01:00Z",
      "2026-09-28T10:00:00Z",
      1000,
      100000
    ),
    0
  )
})
test("import transport schema rejects weighted/objective metadata mixing", () => {
  assert.equal(importDocumentSchema.safeParse(importExample).success, true)
  const q = importExample.questions[0]
  assert.equal(
    importDocumentSchema.safeParse({
      ...importExample,
      questions: [
        {
          ...q,
          options: [
            { id: "a", text: "answer", isCorrect: true, quality: "BEST" },
          ],
        },
      ],
    }).success,
    false
  )
  assert.equal(importDocumentSchema.safeParse([q]).success, false)
})
test("null accuracy is not fabricated as zero", () => {
  assert.equal(percent(null), "—")
  assert.equal(percent(0), "0%")
  assert.equal(percent(72.333), "72.3%")
})
test("API unwrap preserves problem code and request ID", async () => {
  await assert.rejects(
    unwrap(
      Promise.resolve({
        response: new Response("", {
          status: 409,
          headers: { "x-request-id": "trace" },
        }),
        error: {
          code: "ANSWER_LOCKED",
          detail: "Committed answers cannot change.",
        },
      })
    ),
    (error: unknown) =>
      error instanceof ApiError &&
      error.status === 409 &&
      error.code === "ANSWER_LOCKED" &&
      error.requestId === "trace"
  )
  assert.deepEqual(
    await unwrap(
      Promise.resolve({ response: new Response(), data: { data: [] } })
    ),
    { data: [] }
  )
})
test("transport sends cookie credentials and avoids browser response caching", async () => {
  const original = globalThis.fetch
  let options: RequestInit | undefined
  globalThis.fetch = async (_input, init) => {
    options = init
    return new Response("{}")
  }
  try {
    await apiFetch(new Request("http://localhost:4000/api/v1/me"))
    assert.equal(options?.credentials, "include")
    assert.equal(options?.cache, "no-store")
    assert.ok(options?.signal)
  } finally {
    globalThis.fetch = original
  }
})
