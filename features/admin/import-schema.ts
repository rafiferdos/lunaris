import { z } from "zod"
import type { ImportDocument } from "@/lib/api/types"
const common = {
  questionKey: z.string(),
  version: z.number().int(),
  topicSlug: z.string(),
  category: z.enum(["TECHNICAL", "INTERPERSONAL"]),
  difficulty: z.enum(["FOUNDATIONAL", "INTERMEDIATE", "ADVANCED"]),
  prompt: z.string(),
  context: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
  explanation: z.string(),
  tags: z.array(z.string()),
  estimatedTimeSeconds: z.number(),
  provenance: z
    .strictObject({
      collectionId: z.string(),
      authorship: z.literal("ORIGINAL_SOURCE_BASED"),
      sources: z.array(
        z.strictObject({
          url: z.url(),
          title: z.string(),
          accessedOn: z.iso.date(),
        })
      ),
      learningObjective: z.string(),
      difficultyRationale: z.string(),
    })
    .optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
}
const option = z.strictObject({ id: z.string(), text: z.string() })
export const importDocumentSchema = z.strictObject({
  schemaVersion: z.literal(1),
  questions: z
    .array(
      z.discriminatedUnion("type", [
        z.strictObject({
          ...common,
          type: z.literal("SINGLE_CHOICE"),
          options: z.array(option.extend({ isCorrect: z.boolean() })),
        }),
        z.strictObject({
          ...common,
          type: z.literal("MULTIPLE_CHOICE"),
          options: z.array(option.extend({ isCorrect: z.boolean() })),
        }),
        z.strictObject({
          ...common,
          type: z.literal("WEIGHTED_CHOICE"),
          options: z.array(
            option.extend({
              quality: z.enum(["BEST", "STRONG", "ACCEPTABLE", "WEAK"]),
            })
          ),
        }),
      ])
    )
    .min(1)
    .max(1000),
}) satisfies z.ZodType<ImportDocument>
export const emptyImport: ImportDocument = { schemaVersion: 1, questions: [] }
