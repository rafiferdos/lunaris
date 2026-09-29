import type { Mode } from "@/lib/api/types"
export function startKey(userId: string, slug: string, mode: Mode) {
  return `lunaris:start:${userId}:${slug}:${mode}`
}
export function getStartRequestKey(
  key: string,
  storage: Pick<Storage, "getItem" | "setItem">,
  uuid: () => string = () => crypto.randomUUID()
) {
  const existing = storage.getItem(key)
  if (existing) return existing
  const value = uuid()
  storage.setItem(key, value)
  return value
}
