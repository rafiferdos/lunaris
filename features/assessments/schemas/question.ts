import { z } from "zod"
export const difficultySchema = z.enum(["easy", "medium", "competitive"])
const option = z.object({ id: z.string().min(1), text: z.string().min(1) })
const common = {
  id: z.string().min(1),
  topic: z.string().min(1),
  category: z.enum(["Technical", "Interpersonal"]),
  difficulty: difficultySchema,
  prompt: z.string().min(8),
  context: z.string().optional(),
  code: z.string().optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).min(1),
  explanation: z.string().min(1),
  estimatedTimeSeconds: z.number().positive(),
  active: z.boolean(),
  version: z.number().int().positive(),
}
export const questionSchema = z
  .discriminatedUnion("type", [
    z.object({
      ...common,
      type: z.literal("single"),
      options: z.array(option.extend({ correct: z.boolean() })).min(2),
    }),
    z.object({
      ...common,
      type: z.literal("multiple"),
      options: z.array(option.extend({ correct: z.boolean() })).min(2),
    }),
    z.object({
      ...common,
      type: z.literal("weighted"),
      options: z
        .array(
          option.extend({
            quality: z.enum(["Best", "Strong", "Acceptable", "Weak"]),
            weight: z.number().min(0).max(1),
          })
        )
        .min(2),
    }),
  ])
  .superRefine((question, ctx) => {
    if (
      new Set(question.options.map((o) => o.id)).size !==
      question.options.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Option IDs must be unique.",
      })
    if (
      question.type === "single" &&
      question.options.filter((o) => o.correct).length !== 1
    )
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Single-choice questions need exactly one correct answer.",
      })
    if (
      question.type === "multiple" &&
      !question.options.some((o) => o.correct)
    )
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Choose at least one correct answer.",
      })
    if (
      question.type === "weighted" &&
      !question.options.some((o) => o.quality === "Best" && o.weight === 1)
    )
      ctx.addIssue({
        code: "custom",
        path: ["options"],
        message: "Include a Best answer with weight 1.",
      })
  })
export const questionImportSchema = z
  .array(questionSchema)
  .min(1)
  .max(1000)
  .superRefine((questions, ctx) => {
    if (new Set(questions.map((q) => q.id)).size !== questions.length)
      ctx.addIssue({ code: "custom", message: "Question IDs must be unique." })
  })
export type Question = z.infer<typeof questionSchema>
export type Difficulty = z.infer<typeof difficultySchema>
