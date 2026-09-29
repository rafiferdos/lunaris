import { writeFile, rename } from "node:fs/promises"
const origin = new URL(
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"
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
  JSON.stringify(schema, null, 2) + "\n"
)
await rename("lib/api/openapi.json.tmp", "lib/api/openapi.json")
