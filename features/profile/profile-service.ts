import { z } from "zod"
export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  username: z
    .string()
    .regex(
      /^[a-zA-Z0-9_]{3,24}$/,
      "Use 3–24 letters, numbers, or underscores."
    ),
  email: z.email(),
  bio: z.string().max(240),
  country: z.string().min(2),
  skills: z.string().max(120),
})
export type Profile = z.infer<typeof profileSchema>
export const profileService = {
  get: (): Profile => ({
    name: "Rafi Ferdos",
    username: "rafiferdos",
    email: "rafi@example.com",
    bio: "Frontend engineer. Curious about the details that make great software.",
    country: "Bangladesh",
    skills: "JavaScript, React, Communication",
  }),
}
export const userBaseline = {
  id: "rafi",
  rating: 1483,
  rank: 128,
  xp: 2840,
  streak: 5,
  longestStreak: 12,
  joined: "June 2026",
}
