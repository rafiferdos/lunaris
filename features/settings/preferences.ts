"use client"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useWorkspace } from "@/features/workspace/workspace-provider"
import { useSession } from "@/features/auth/auth-boundary"
import { apiFor, unwrap } from "@/lib/api/client"
import { queries, privateKey } from "@/lib/api/queries"
import { preferenceSchema, type Preferences } from "./schema"
export { preferenceSchema, defaults, type Preferences } from "./schema"
export { applyPreferences, radii } from "./appearance"
export function usePreferences() {
  const { preferences, profile } = useWorkspace()
  return preferenceSchema.parse({
    ...preferences,
    difficulty: preferences.difficulty?.toLowerCase(),
    topics: profile.preferredTopics,
  })
}
export function useUpdatePreferences() {
  const { user } = useSession(),
    client = useQueryClient()
  return useMutation({
    scope: { id: "preferences" },
    mutationFn: async (patch: Partial<Preferences>) => {
      const { topics, difficulty, ...rest } = patch
      if (topics)
        await unwrap(
          apiFor(user.id).PATCH("/api/v1/me", {
            body: { preferredTopics: topics },
          })
        )
      return (
        await unwrap(
          apiFor(user.id).PATCH("/api/v1/me/preferences", {
            body: {
              ...rest,
              ...(difficulty
                ? {
                    difficulty: (
                      {
                        easy: "EASY",
                        medium: "MEDIUM",
                        competitive: "COMPETITIVE",
                      } as const
                    )[difficulty],
                  }
                : {}),
            },
          })
        )
      ).data
    },
    onSuccess: async (data) => {
      client.setQueryData(queries.preferences(user.id).queryKey, data)
    },
    onSettled: async () => {
      await client.invalidateQueries({
        queryKey: privateKey(user.id),
        predicate: (query) =>
          ["profile", "preferences", "overview", "rankings"].includes(
            String(query.queryKey[2])
          ),
      })
    },
  })
}
