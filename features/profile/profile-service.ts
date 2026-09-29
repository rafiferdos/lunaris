import { z } from "zod"
export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  username: z.union([
    z.literal(""),
    z
      .string()
      .regex(
        /^[a-z][a-z0-9_]{2,23}$/,
        "Use 3–24 lowercase letters, digits or underscores, starting with a letter."
      ),
  ]),
  bio: z.string().max(500),
  country: z.union([
    z.literal(""),
    z
      .string()
      .regex(/^[A-Z]{2}$/, "Use a two-letter country code, such as BD."),
  ]),
  timezone: z.string().refine((value) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: value })
      return true
    } catch {
      return false
    }
  }, "Use a valid timezone."),
  preferredTopics: z.array(z.string()).max(30),
})
export type ProfileDraft = z.infer<typeof profileSchema>
