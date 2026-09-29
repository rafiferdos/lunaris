import { queryOptions, type QueryClient } from "@tanstack/react-query"
import { api, unwrap } from "./client"
import type { HistoryFilters, RankingFilters } from "./types"
export const privateKey = (userId: string) => ["private", userId] as const
export const queries = {
  profile: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "profile"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/me", { signal }))).data,
    }),
  preferences: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "preferences"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/me/preferences", { signal }))).data,
    }),
  assessments: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "assessments"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/assessments", { signal }))).data,
    }),
  overview: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "overview"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/stats/overview", { signal }))).data,
    }),
  activity: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "activity"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/stats/activity", { signal }))).data,
    }),
  performance: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "performance"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/stats/performance", { signal }))).data,
    }),
  topics: (id: string) =>
    queryOptions({
      queryKey: [...privateKey(id), "topics"],
      queryFn: async ({ signal }) =>
        (await unwrap(api.GET("/api/v1/stats/topics", { signal }))).data,
    }),
  history: (id: string, filters: HistoryFilters = {}) =>
    queryOptions({
      queryKey: [...privateKey(id), "history", filters],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/history", { params: { query: filters }, signal })
        ),
    }),
  rankings: (id: string, filters: RankingFilters = {}) =>
    queryOptions({
      queryKey: [...privateKey(id), "rankings", filters],
      queryFn: ({ signal }) =>
        unwrap(
          api.GET("/api/v1/leaderboards", {
            params: { query: filters },
            signal,
          })
        ),
    }),
  attempt: (userId: string, id: string) =>
    queryOptions({
      queryKey: [...privateKey(userId), "attempt", id],
      queryFn: async ({ signal }) =>
        (
          await unwrap(
            api.GET("/api/v1/attempts/{id}", {
              params: { path: { id } },
              signal,
            })
          )
        ).data,
      staleTime: 0,
    }),
}
export function invalidateProgress(client: QueryClient, userId: string) {
  return client.invalidateQueries({
    queryKey: privateKey(userId),
    predicate: (q) => q.queryKey[2] !== "attempt",
  })
}
