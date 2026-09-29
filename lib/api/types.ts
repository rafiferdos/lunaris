import type { paths } from "./schema"
type JsonResponse<T> = T extends {
  responses: { 200: { content: { "application/json": infer R } } }
}
  ? R
  : never
export type GetResponse<P extends keyof paths> = JsonResponse<paths[P]["get"]>
export type Assessment = GetResponse<"/api/v1/assessments">["data"][number]
export type ServerAttempt = GetResponse<"/api/v1/attempts/{id}">["data"]
export type ServerQuestion = ServerAttempt["questions"][number]
export type Result = NonNullable<ServerAttempt["result"]>
export type Profile = GetResponse<"/api/v1/me">["data"]
export type Preferences = GetResponse<"/api/v1/me/preferences">["data"]
export type Overview = GetResponse<"/api/v1/stats/overview">["data"]
export type HistoryRow = GetResponse<"/api/v1/history">["data"][number]
export type HistoryFilters = NonNullable<
  paths["/api/v1/history"]["get"]["parameters"]["query"]
>
export type RankingFilters = NonNullable<
  paths["/api/v1/leaderboards"]["get"]["parameters"]["query"]
>
export type RankedUser = GetResponse<"/api/v1/leaderboards">["data"][number]
export type Mode = ServerAttempt["mode"]
export type IntegrityEvent =
  paths["/api/v1/attempts/{id}/integrity-events"]["post"]["requestBody"]["content"]["application/json"]
export type ProfilePatch =
  paths["/api/v1/me"]["patch"]["requestBody"]["content"]["application/json"]
export type PreferencePatch =
  paths["/api/v1/me/preferences"]["patch"]["requestBody"]["content"]["application/json"]
export type ImportDocument =
  paths["/api/v1/admin/questions/import"]["post"]["requestBody"]["content"]["application/json"]
