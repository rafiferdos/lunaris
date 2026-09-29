export type Category = "Technical" | "Interpersonal"
export interface Topic {
  slug: string
  name: string
  monogram: string
  category: Category
  description: string
  mastery: number
  accent: "amber" | "blue" | "mint" | "rose" | "neutral"
  available: boolean
}
