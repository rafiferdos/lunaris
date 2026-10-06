import {
  test,
  expect,
  type Page,
  type APIRequestContext,
} from "@playwright/test"
import AxeBuilder from "@axe-core/playwright"
import { writeFile } from "node:fs/promises"
import { randomUUID } from "node:crypto"
import { setTimeout as delay } from "node:timers/promises"
const api = process.env.E2E_API_URL ?? "http://localhost:4000"
const origin = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000"
const password = "Browser-integration-2026!"
async function waitForAuthLimit(headers: Record<string, string>) {
  // Better Auth resets this window after inactivity, not every clock minute.
  // Retry only an explicit 429, which has not created an account.
  const seconds = Number(headers["retry-after"] ?? 60)
  await delay(
    (Number.isFinite(seconds) ? Math.min(65, Math.max(1, seconds)) : 60) *
      1000 +
      1000
  )
}
async function register(page: Page) {
  const email = `browser-${randomUUID()}@example.com`
  await page.goto("/register")
  await page.getByLabel("Full name").fill("Browser Member")
  await page.getByLabel("Email address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  async function submit() {
    const response = page.waitForResponse((r) =>
      r.url().endsWith("/api/auth/sign-up/email")
    )
    await page
      .getByRole("button", { name: "Create account", exact: true })
      .click()
    return response
  }
  let response = await submit()
  if (response.status() === 429) {
    await waitForAuthLimit(response.headers())
    response = await submit()
  }
  expect(response.ok()).toBeTruthy()
  await expect(page).toHaveURL(/\/assessments$/)
  await expect(
    page.getByRole("heading", { name: /Welcome back/ })
  ).toBeVisible()
  return email
}
async function start(page: Page, mode = "easy") {
  await page.goto(`/assessments/javascript/take?level=${mode}`)
  await page.getByRole("checkbox", { name: /I understand/ }).check()
  await page
    .getByRole("button", { name: "Start assessment", exact: true })
    .click()
  await expect(page).toHaveURL(/attempt=/)
  await expect(page.locator(".quiz-question")).toBeVisible()
  return new URL(page.url()).searchParams.get("attempt")!
}
async function createViaApi(request: APIRequestContext, mode = "EASY") {
  const response = await request.post(`${api}/api/v1/attempts`, {
    headers: { Origin: origin },
    data: { topicSlug: "javascript", mode, requestKey: randomUUID() },
  })
  expect(response.ok(), await response.text()).toBeTruthy()
  return (await response.json()).data
}

test("private routes require a real session", async ({ page }) => {
  await page.goto("/profile")
  await expect(page).toHaveURL(/\/login\?next=/)
  await expect(
    page.getByRole("button", { name: "Sign in", exact: true })
  ).toBeVisible()
})
test("signup, autosave, reload, finalize, profile, preferences and logout", async ({
  page,
}) => {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  const email = await register(page),
    id = await start(page)
  const before = (
    await (await page.request.get(`${api}/api/v1/attempts/${id}`)).json()
  ).data
  for (const key of ["isCorrect", "quality", "explanation"])
    expect(JSON.stringify(before.questions)).not.toContain(`"${key}"`)
  const saved = page.waitForResponse(
    (r) =>
      r.url().includes(`/answers/`) &&
      r.request().method() === "PUT" &&
      r.status() === 200
  )
  await page.locator(".answer-option").first().click()
  await saved
  await page.reload()
  await expect(page.locator(".quiz-question")).toHaveText(
    before.questions[0].prompt
  )
  const resumed = (
    await (await page.request.get(`${api}/api/v1/attempts/${id}`)).json()
  ).data
  expect(
    resumed.questions.map((q: { id: string; options: unknown[] }) => [
      q.id,
      q.options,
    ])
  ).toEqual(
    before.questions.map((q: { id: string; options: unknown[] }) => [
      q.id,
      q.options,
    ])
  )
  expect(resumed.questions[0].selected).toHaveLength(1)
  for (let i = 0; i < 5; i++) {
    if (i > 0) await page.locator(".answer-option").first().click()
    if (i < 4) {
      await page
        .getByRole("button", { name: "Next question", exact: true })
        .click()
      await expect(page.locator(".quiz-question")).toHaveText(
        before.questions[i + 1].prompt
      )
    } else {
      await page
        .getByRole("button", { name: "Submit assessment", exact: true })
        .click()
      await page
        .getByRole("alertdialog")
        .getByRole("button", { name: "Submit assessment", exact: true })
        .click()
    }
  }
  await expect(page).toHaveURL(/\/results\//)
  await expect(
    page.getByRole("heading", { name: "Answer review" })
  ).toBeVisible()
  await page.screenshot({
    path: "test-results/connected-result.png",
    fullPage: true,
  })
  for (const [path, heading] of [
    ["/history", "Assessment history"],
    ["/stats", "Your effort, made visible."],
    ["/leaderboard", "The leaderboard"],
  ]) {
    await page.goto(path)
    await expect(
      page.getByRole("heading", { name: heading, exact: true })
    ).toBeVisible()
    if (path === "/stats") {
      await expect(page.locator(".recharts-surface")).toBeVisible()
      await page.screenshot({
        path: "test-results/populated-stats.png",
        fullPage: true,
      })
      for (const tab of ["Skills", "Activity"]) {
        await page.getByRole("tab", { name: tab, exact: true }).click()
        await expect(
          page.getByRole("tabpanel", { name: tab, exact: true })
        ).toBeVisible()
        await expect(
          page.getByRole("tabpanel", { name: tab, exact: true })
        ).not.toBeEmpty()
      }
    }
  }
  await expect(page.getByText("Live updates", { exact: true })).toBeVisible()
  await page.goto("/profile")
  await page.getByRole("button", { name: "Edit profile" }).click()
  await page
    .getByLabel("Display name", { exact: true })
    .fill("Updated Browser Member")
  await page.getByRole("button", { name: "Save changes", exact: true }).click()
  await expect(page.getByText("Profile saved to your account.")).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("heading", { name: "Updated Browser Member", exact: true })
  ).toBeVisible()
  await page.goto("/settings")
  const change = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/preferences") &&
      r.request().method() === "PATCH" &&
      r.ok()
  )
  await page
    .getByRole("switch", { name: "Public profile", exact: true })
    .click()
  await change
  await page.reload()
  await expect(
    page.getByRole("switch", { name: "Public profile", exact: true })
  ).not.toBeChecked()
  await page.goto("/admin/questions/import")
  await expect(
    page.getByRole("heading", { name: "Administrator access required" })
  ).toBeVisible()
  await page.getByRole("button", { name: "Sign out", exact: true }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goto("/login")
  await page.getByLabel("Email address").fill(email)
  await page.getByLabel("Password", { exact: true }).fill(password)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/assessments$/)
  await expect(
    page.getByRole("heading", { name: /Welcome back, Updated/ })
  ).toBeVisible()
  expect(errors).toEqual([])
})
test("lost start response retries the same request key without consuming another attempt", async ({
  page,
}) => {
  await register(page)
  let lost = false
  const keys: string[] = []
  await page.route(`${api}/api/v1/attempts`, async (route) => {
    if (route.request().method() !== "POST") return route.continue()
    keys.push(route.request().postDataJSON().requestKey)
    const response = await route.fetch()
    if (!lost) {
      lost = true
      await route.abort("failed")
    } else await route.fulfill({ response })
  })
  await page.goto("/assessments/javascript/take?level=easy")
  await page.getByRole("checkbox", { name: /I understand/ }).check()
  await page
    .getByRole("button", { name: "Start assessment", exact: true })
    .click()
  await expect(page.getByRole("button", { name: "Retry start" })).toBeVisible()
  await page.getByRole("button", { name: "Retry start" }).click()
  await expect(page).toHaveURL(/attempt=/)
  expect(new Set(keys).size).toBe(1)
})
test("Competitive committed answer survives refresh and tab-hidden auto-submits", async ({
  page,
}) => {
  await register(page)
  const attempt = await createViaApi(page.request, "COMPETITIVE")
  await page.goto(`/assessments/javascript/take?attempt=${attempt.id}`)
  await page.locator(".answer-option").first().click()
  await page.getByRole("button", { name: "Next question", exact: true }).click()
  await expect(page.locator(".quiz-question")).toHaveText(
    attempt.questions[1].prompt
  )
  await page.reload()
  await expect(page.locator(".quiz-question")).toHaveText(
    attempt.questions[1].prompt
  )
  await expect(
    page.getByRole("button", { name: "Previous", exact: true })
  ).toBeDisabled()
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    })
    document.dispatchEvent(new Event("visibilitychange"))
  })
  await expect(page).toHaveURL(/\/results\//)
  await expect(page.getByText(/not eligible for ranked rewards/)).toBeVisible()
  const final = (
    await (
      await page.request.get(`${api}/api/v1/attempts/${attempt.id}`)
    ).json()
  ).data
  expect(final.status).toBe("AUTO_SUBMITTED")
  expect(final.result.xp).toBe(0)
  expect(final.result.reviews[0].selected).toHaveLength(1)
})
test("local speech model starts and microphone resources stop on navigation", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["microphone"])
  await register(page)
  await start(page)
  await page.evaluate(() => {
    const media = navigator.mediaDevices
    const original = media.getUserMedia.bind(media)
    const captured = window as typeof window & { testStreams: MediaStream[] }
    captured.testStreams = []
    media.getUserMedia = async (constraints) => {
      const stream = await original(constraints)
      captured.testStreams.push(stream)
      return stream
    }
  })
  await page
    .getByRole("button", { name: "Enable local speech monitoring" })
    .click()
  await expect(
    page.getByRole("button", { name: "Microphone monitoring active" })
  ).toBeVisible({ timeout: 40_000 })
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as typeof window & { testStreams: MediaStream[] }).testStreams
          .flatMap((stream) => stream.getTracks())
          .some((track) => track.readyState === "live")
      )
    )
    .toBeTruthy()
  await page.getByRole("link", { name: "History", exact: true }).click()
  await expect(
    page.getByRole("heading", { name: "Assessment history", exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(() =>
        (window as typeof window & { testStreams: MediaStream[] }).testStreams
          .flatMap((stream) => stream.getTracks())
          .every((track) => track.readyState === "ended")
      )
    )
    .toBeTruthy()
})
test("admin validates and imports JSON through the real API", async ({
  page,
}) => {
  test.skip(
    !process.env.SEED_PASSWORD,
    "Set the local seed password to exercise admin import."
  )
  await page.goto("/login")
  await page.getByLabel("Email address").fill("admin@lunaris.local")
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_PASSWORD!)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/assessments$/)
  await page.goto("/admin/questions/import")
  await page.getByRole("button", { name: "Load example" }).click()
  const input = page.getByLabel("Question JSON", { exact: true }),
    document = JSON.parse(await input.inputValue())
  document.questions[0].questionKey = `browser-import-${randomUUID()}`
  await input.fill(JSON.stringify(document))
  await page.getByRole("button", { name: "Validate batch" }).click()
  await expect(page.getByText("Batch is valid. Ready to import.")).toBeVisible()
  await page.getByRole("button", { name: "Import validated batch" }).click()
  await expect(page.getByText(/Import complete: 1 created/)).toBeVisible()
  await page.goto("/admin/questions")
  await page
    .getByRole("button", {
      name: new RegExp(document.questions[0].questionKey),
    })
    .first()
    .click()
  const publication = page.getByRole("combobox", {
    name: `Publication for ${document.questions[0].questionKey}`,
  })
  await publication.click()
  await page.getByRole("option", { name: "PUBLISHED", exact: true }).click()
  await page
    .getByRole("button", { name: "Update publication", exact: true })
    .click()
  let saved = page.waitForResponse(
    (r) => r.url().includes("/publication") && r.request().method() === "PATCH"
  )
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Update publication", exact: true })
    .click()
  expect((await saved).ok()).toBeTruthy()
  await expect(page.getByRole("alertdialog")).toHaveCount(0)
  await expect(
    page.getByText("Publication updated.", { exact: true })
  ).toBeVisible()
  if (!(await publication.isVisible()))
    await page
      .getByRole("button", {
        name: new RegExp(document.questions[0].questionKey),
      })
      .click()
  await publication.click()
  await page.getByRole("option", { name: "ARCHIVED", exact: true }).click()
  await page
    .getByRole("button", { name: "Update publication", exact: true })
    .click()
  saved = page.waitForResponse(
    (r) => r.url().includes("/publication") && r.request().method() === "PATCH"
  )
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Update publication", exact: true })
    .click()
  expect((await saved).ok()).toBeTruthy()
  await page
    .getByRole("tab", { name: "Assessment settings", exact: true })
    .click()
  await page
    .getByRole("button", { name: "Save assessment settings", exact: true })
    .click()
  saved = page.waitForResponse(
    (r) =>
      r.url().includes("/assessment-configs/") && r.request().method() === "PUT"
  )
  await page
    .getByRole("alertdialog")
    .getByRole("button", { name: "Save settings", exact: true })
    .click()
  expect((await saved).ok()).toBeTruthy()
  await page.getByRole("tab", { name: "Audit trail", exact: true }).click()
  await expect(page.getByRole("table")).toBeVisible()
  await expect(page.getByRole("row")).not.toHaveCount(1)
})

test("only one tab edits an attempt and the lease transfers after closing it", async ({
  page,
  context,
}) => {
  await register(page)
  const id = await start(page)
  const second = await context.newPage()
  await second.goto(`/assessments/javascript/take?attempt=${id}`)
  await expect(
    second.getByRole("heading", { name: "This attempt is open in another tab" })
  ).toBeVisible()
  await page.close()
  await second.getByRole("button", { name: "Resume here" }).click()
  await expect(second.locator(".quiz-question")).toBeVisible()
  await second.close()
})
test("integrity delivery retries the same event after a lost response", async ({
  page,
}) => {
  await register(page)
  await start(page)
  let lose = true
  const received: { sequence: number; type: string }[] = []
  await page.route("**/integrity-events", async (route) => {
    const body = route.request().postDataJSON()
    received.push(body)
    const response = await route.fetch()
    if (lose) {
      lose = false
      await route.abort("failed")
    } else await route.fulfill({ response })
  })
  await page.evaluate(() => window.dispatchEvent(new Event("blur")))
  await expect(page.getByText(/Integrity signals will retry/)).toBeVisible()
  await page.evaluate(() => window.dispatchEvent(new Event("online")))
  await expect(page.getByText(/Integrity signals will retry/)).not.toBeVisible()
  expect(received.length).toBeGreaterThanOrEqual(2)
  expect(received[0]).toEqual(received[1])
  await expect(page.getByText("Integrity 97%", { exact: true })).toBeVisible()
})
test("a committed result updates another browser through SSE", async ({
  page,
  request,
}) => {
  await register(page)
  await page.goto("/leaderboard")
  await page.getByRole("combobox", { name: "Ranking category" }).click()
  await page.getByRole("option", { name: "interpersonal", exact: true }).click()
  await expect(page.getByText("Live updates", { exact: true })).toBeVisible()
  const name = `Live member ${randomUUID().slice(0, 8)}`
  const signupOptions = {
    headers: { Origin: origin },
    data: { name, email: `live-${randomUUID()}@example.com`, password },
  }
  let signup = await request.post(
    `${api}/api/auth/sign-up/email`,
    signupOptions
  )
  if (signup.status() === 429) {
    await waitForAuthLimit(signup.headers())
    signup = await request.post(`${api}/api/auth/sign-up/email`, signupOptions)
  }
  expect(signup.ok()).toBeTruthy()
  const startResponse = await request.post(`${api}/api/v1/attempts`, {
    headers: { Origin: origin },
    data: {
      topicSlug: "communication",
      mode: "MEDIUM",
      requestKey: randomUUID(),
    },
  })
  expect(startResponse.ok()).toBeTruthy()
  const attempt = (await startResponse.json()).data
  const submission = await request.post(
    `${api}/api/v1/attempts/${attempt.id}/submit`,
    { headers: { Origin: origin }, data: {} }
  )
  expect(submission.ok()).toBeTruthy()
  await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  expect(
    (
      await request.patch(`${api}/api/v1/me/preferences`, {
        headers: { Origin: origin },
        data: { publicProfile: false },
      })
    ).ok()
  ).toBeTruthy()
  await expect(page.getByText(name, { exact: true })).toHaveCount(0)
})
test("mobile workspace and assessment fit without page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await register(page)
  await expect(
    page.getByRole("button", { name: "Open navigation" })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBeTruthy()
  await start(page)
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBeTruthy()
  await page.screenshot({
    path: "test-results/connected-mobile.png",
    fullPage: true,
  })
})

test("navigation flushes a fresh answer and a failed save keeps the user on the quiz", async ({
  page,
}) => {
  await register(page)
  const id = await start(page)
  await page.getByRole("link", { name: "History", exact: true }).hover()
  await page.locator(".answer-option").first().click()
  await page.getByRole("link", { name: "History", exact: true }).click()
  await expect(page).toHaveURL(/\/history$/)
  const saved = (
    await (await page.request.get(`${api}/api/v1/attempts/${id}`)).json()
  ).data
  expect(saved.questions[0].selected).toHaveLength(1)
  await page.goto(`/assessments/javascript/take?attempt=${id}`)
  await page.locator(".quiz-question").waitFor()
  await page.route("**/answers/*", (route) => route.abort("failed"))
  await page.locator(".answer-option").nth(1).click()
  await page.getByRole("link", { name: "History", exact: true }).click()
  await expect(page.getByRole("alertdialog")).toBeVisible()
  await expect(page).toHaveURL(/attempt=/)
  await page.unroute("**/answers/*")
  await page.getByRole("button", { name: "Retry save", exact: true }).click()
  await expect(page).toHaveURL(/\/history$/)
  const recovered = (
    await (await page.request.get(`${api}/api/v1/attempts/${id}`)).json()
  ).data
  expect(recovered.questions[0].selected).toContain(
    saved.questions[0].options[1].id
  )
})

test("account changes synchronize tabs and stale identity requests are rejected", async ({
  page,
  context,
}) => {
  await register(page)
  const first = (await (await page.request.get(`${api}/api/v1/me`)).json()).data
  await page.goto("/profile")
  const other = await context.newPage()
  await register(other)
  const second = (await (await other.request.get(`${api}/api/v1/me`)).json())
    .data
  expect(first.id).not.toBe(second.id)
  await expect(page).toHaveURL(/\/assessments$/)
  const stale = await page.request.patch(`${api}/api/v1/me`, {
    headers: { Origin: origin, "X-Lunaris-User": first.id },
    data: { displayName: "Wrong account write" },
  })
  expect(stale.status()).toBe(409)
  expect((await stale.json()).code).toBe("SESSION_CHANGED")
  await page.goto("/profile")
  await expect(
    page.getByText(`Email: ${second.email}`, { exact: true })
  ).toBeVisible()
  await expect(page.getByText(first.email, { exact: true })).toHaveCount(0)
})

test("activity errors do not block profile or an assessment and timer preferences apply", async ({
  page,
}) => {
  await register(page)
  await page.route("**/api/v1/stats/activity", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/problem+json",
      body: JSON.stringify({
        detail: "Activity temporarily unavailable",
        code: "UNAVAILABLE",
      }),
    })
  )
  await page.goto("/profile")
  await expect(
    page.getByRole("button", { name: "Edit profile", exact: true })
  ).toBeVisible()
  await page.goto("/settings")
  const saved = page.waitForResponse(
    (r) =>
      r.url().endsWith("/me/preferences") && r.request().method() === "PATCH"
  )
  await page
    .getByRole("switch", { name: "Show the timer", exact: true })
    .click()
  expect((await saved).ok()).toBeTruthy()
  await expect(
    page.getByRole("switch", { name: "Show the timer", exact: true })
  ).not.toBeChecked()
  await start(page)
  await expect(page.getByText(/\d+:\d{2} remaining/)).toHaveCount(0)
  await expect(page.locator(".quiz-question")).toBeVisible()
})

test("keyboard date filters use a shadcn calendar instead of a native picker", async ({
  page,
}) => {
  await register(page)
  await page.goto("/history")
  await page.getByRole("button", { name: "From (UTC)", exact: true }).click()
  await expect(page.locator('[data-slot="calendar"]')).toBeVisible()
  await page.keyboard.press("Escape")
  await expect(page.locator('select, input[type="date"]')).toHaveCount(0)
})

test("visual and accessibility audit of all workspace routes in light/dark and mobile/desktop", async ({
  page,
}) => {
  test.setTimeout(240_000)
  await register(page)
  await page.emulateMedia({ reducedMotion: "reduce" })
  const failures: unknown[] = []
  for (const mode of ["light", "dark"] as const) {
    expect(
      (
        await page.request.patch(`${api}/api/v1/me/preferences`, {
          headers: { Origin: origin },
          data: { mode, reducedMotion: true },
        })
      ).ok()
    ).toBeTruthy()
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 })
      for (const route of [
        "assessments",
        "assessments/javascript",
        "history",
        "stats",
        "leaderboard",
        "profile",
        "settings",
      ]) {
        await page.goto(`/${route}`)
        await expect(page.locator("main h1")).toBeVisible()
        await expect(page.locator("html")).toHaveClass(new RegExp(mode))
        await page.evaluate(() => document.fonts.ready)
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        )
        if (overflow)
          failures.push({
            mode,
            width,
            route,
            problem: "horizontal page overflow",
          })
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
        for (const violation of results.violations)
          failures.push({
            mode,
            width,
            route,
            id: violation.id,
            impact: violation.impact,
            nodes: violation.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })
        await page.screenshot({
          path: `test-results/visual-audit/${mode}-${width}-${route.replaceAll("/", "-")}.png`,
          fullPage: true,
        })
      }
    }
  }
  await writeFile(
    "test-results/visual-audit/findings.json",
    JSON.stringify(failures, null, 2)
  )
  expect(failures).toEqual([])
})

test("auth, preflight, answer controls and result meet accessibility checks", async ({
  page,
}) => {
  test.setTimeout(180_000)
  await page.emulateMedia({ reducedMotion: "reduce" })
  const check = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
    await page.screenshot({
      path: `test-results/visual-audit/${name}.png`,
      fullPage: true,
    })
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }))
    ).toEqual([])
  }
  for (const route of [
    "login",
    "register",
    "forgot-password",
    "reset-password",
    "verify-email",
    "unsubscribe",
  ]) {
    await page.goto(`/${route}`)
    await expect(page.locator("main h1")).toBeVisible()
    await check(route)
  }
  await register(page)
  await page.goto("/assessments/javascript/take?level=easy")
  await expect(
    page.getByRole("button", { name: "Start assessment", exact: true })
  ).toBeVisible()
  await check("preflight")
  const id = await start(page)
  await check("quiz-desktop")
  await page.setViewportSize({ width: 390, height: 844 })
  await check("quiz-mobile")
  const response = await page.request.post(
    `${api}/api/v1/attempts/${id}/submit`,
    { headers: { Origin: origin }, data: {} }
  )
  expect(response.ok()).toBeTruthy()
  await page.goto(`/results/${id}`)
  await expect(
    page.getByRole("heading", { name: "Answer review" })
  ).toBeVisible()
  await check("result-mobile")
  await page.setViewportSize({ width: 1440, height: 1000 })
  await check("result-desktop")
})

test("every supported palette persists and compact layouts remain accessible", async ({
  page,
}) => {
  test.setTimeout(240_000)
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 390, height: 844 })
  await register(page)
  const failures: unknown[] = []
  for (const palette of [
    "taupe",
    "neutral",
    "stone",
    "zinc",
    "blue",
    "green",
    "rose",
  ]) {
    for (const mode of ["light", "dark"]) {
      expect(
        (
          await page.request.patch(`${api}/api/v1/me/preferences`, {
            headers: { Origin: origin },
            data: {
              palette,
              mode,
              density: "compact",
              radius: "sharp",
              reducedMotion: true,
            },
          })
        ).ok()
      ).toBeTruthy()
      for (const route of ["settings", "assessments/javascript"]) {
        await page.goto(`/${route}`)
        await expect(page.locator("main h1")).toBeVisible()
        await expect(page.locator("html")).toHaveAttribute(
          "data-palette",
          palette
        )
        await expect(page.locator("html")).toHaveClass(new RegExp(mode))
        await expect(page.locator("html")).toHaveAttribute(
          "data-density",
          "compact"
        )
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBeTruthy()
        const results = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
          .analyze()
        for (const v of results.violations)
          failures.push({
            palette,
            mode,
            route,
            id: v.id,
            nodes: v.nodes.map((n) => ({
              target: n.target,
              summary: n.failureSummary,
            })),
          })
        await page.screenshot({
          path: `test-results/palette-audit/${palette}-${mode}-${route.replaceAll("/", "-")}.png`,
          fullPage: true,
        })
      }
    }
  }
  await writeFile(
    "test-results/palette-audit/findings.json",
    JSON.stringify(failures, null, 2)
  )
  expect(failures).toEqual([])
})

test("admin screens fit mobile and expose accessible content, settings and audit", async ({
  page,
}) => {
  test.skip(
    !process.env.SEED_PASSWORD,
    "Set the local seed password to exercise admin screens."
  )
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.goto("/login")
  await page.getByLabel("Email address").fill("admin@lunaris.local")
  await page
    .getByLabel("Password", { exact: true })
    .fill(process.env.SEED_PASSWORD!)
  await page.getByRole("button", { name: "Sign in", exact: true }).click()
  await expect(page).toHaveURL(/\/assessments$/)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/admin/questions")
  await expect(
    page.getByRole("heading", { name: "Question bank", exact: true })
  ).toBeVisible()
  for (const tab of ["Questions", "Assessment settings", "Audit trail"]) {
    await page.getByRole("tab", { name: tab, exact: true }).click()
    await expect(
      page.getByRole("tabpanel", { name: tab, exact: true })
    ).toBeVisible()
    if (tab === "Assessment settings")
      await expect(
        page.getByRole("button", {
          name: "Save assessment settings",
          exact: true,
        })
      ).toBeVisible()
    if (tab === "Audit trail")
      await expect(page.getByRole("table")).toBeVisible()
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBeTruthy()
    const result = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze()
    expect(
      result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      }))
    ).toEqual([])
    await page.screenshot({
      path: `test-results/admin-audit/${tab.replaceAll(" ", "-")}.png`,
      fullPage: true,
    })
  }
})

test("signup refreshes a cached guest session and public email controls work on mobile", async ({
  page,
}) => {
  await page.goto("/profile")
  await expect(page).toHaveURL(/\/login\?next=/)
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(
    page.getByRole("link", { name: "Need an email verification link?" })
  ).toBeVisible()
  await page
    .getByRole("link", { name: "Need an email verification link?" })
    .click()
  await expect(
    page.getByRole("heading", { name: "Verify your email", exact: true })
  ).toBeVisible()
  await expect(
    page.getByText(
      "Email verification is not configured. You can sign in without it."
    )
  ).toBeVisible()
  await page.goto("/unsubscribe?token=invalid-test-token")
  await expect(
    page.getByRole("heading", { name: "Email preferences" })
  ).toBeVisible()
  const result = page.waitForResponse((r) =>
    r.url().includes("/api/notifications/unsubscribe")
  )
  await page.getByRole("button", { name: "Unsubscribe", exact: true }).click()
  expect((await result).status()).toBe(400)
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "invalid or expired"
  )
  await register(page)
  await expect(
    page.getByRole("heading", { name: /Welcome back/ })
  ).toBeVisible()
})
