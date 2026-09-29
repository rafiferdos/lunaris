"use client"
import { useWorkspace } from "@/features/workspace/workspace-provider"
export function useProfile() {
  const { profile } = useWorkspace()
  return {
    ...profile,
    name: profile.displayName,
    username: profile.username ?? "",
    country: profile.country ?? "",
    skills: profile.preferredTopics.join(", "),
  }
}
