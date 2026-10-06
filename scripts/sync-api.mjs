import { writeFile, rename } from "node:fs/promises"
import { format, resolveConfig } from "prettier"
const origin = new URL(
  process.env.API_SCHEMA_URL ??
    (process.env.NEXT_PUBLIC_API_URL === "same-origin"
      ? process.env.API_UPSTREAM
      : process.env.NEXT_PUBLIC_API_URL) ??
    "http://localhost:4000"
)
const response = await fetch(new URL("/openapi.json", origin), {
  signal: AbortSignal.timeout(15000),
})
if (!response.ok) throw new Error(`OpenAPI fetch failed (${response.status})`)
const schema = await response.json()
if (!schema.openapi || !schema.paths?.["/api/v1/attempts"])
  throw new Error("Unexpected API contract")
await writeFile(
  "lib/api/openapi.json.tmp",
  await format(JSON.stringify(schema), {
    ...(await resolveConfig("lib/api/openapi.json")),
    parser: "json",
  })
)
await rename("lib/api/openapi.json.tmp", "lib/api/openapi.json")
