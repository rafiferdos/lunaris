"use client"
import { useLocalValue } from "@/lib/local-store"
import { profileSchema, profileService } from "./profile-service"
const initial = profileService.get()
export function useProfile() {
  return useLocalValue("lunaris:profile", initial, (v) =>
    profileSchema.parse(v)
  )
}
