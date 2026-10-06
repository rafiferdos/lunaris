import { z } from "zod"
export const preferenceSchema = z.object({
  palette: z
    .enum(["taupe", "neutral", "stone", "zinc", "blue", "green", "rose"])
    .default("taupe"),
  radius: z
    .enum(["sharp", "compact", "default", "soft", "rounded"])
    .default("default"),
  density: z.enum(["comfortable", "compact"]).default("comfortable"),
  reducedMotion: z.boolean().default(false),
  difficulty: z.enum(["easy", "medium", "competitive"]).default("easy"),
  timer: z.boolean().default(true),
  email: z.boolean().default(false),
  reminders: z.boolean().default(false),
  publicProfile: z.boolean().default(true),
  topics: z.array(z.string()).default([]),
  mode: z.enum(["light", "dark", "system"]).default("system"),
})
export type Preferences = z.infer<typeof preferenceSchema>
export const defaults = preferenceSchema.parse({})
