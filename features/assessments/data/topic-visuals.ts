import type { Topic } from "../types/assessment"
export const topicVisuals: Record<
  string,
  Pick<Topic, "monogram" | "accent">
> = {
  javascript: {
    monogram: "JS",
    accent: "amber",
  },
  typescript: {
    monogram: "TS",
    accent: "blue",
  },
  react: {
    monogram: "Re",
    accent: "blue",
  },
  nextjs: {
    monogram: "N",
    accent: "neutral",
  },
  nodejs: {
    monogram: "No",
    accent: "mint",
  },
  express: {
    monogram: "Ex",
    accent: "neutral",
  },
  hono: {
    monogram: "Ho",
    accent: "amber",
  },
  postgresql: {
    monogram: "Pg",
    accent: "blue",
  },
  "rest-apis": {
    monogram: "API",
    accent: "mint",
  },
  graphql: {
    monogram: "Gq",
    accent: "rose",
  },
  git: {
    monogram: "Gt",
    accent: "amber",
  },
  "web-security": {
    monogram: "Ws",
    accent: "mint",
  },
  testing: {
    monogram: "Te",
    accent: "rose",
  },
  "system-design": {
    monogram: "Sd",
    accent: "neutral",
  },
  "problem-solving": {
    monogram: "Ps",
    accent: "blue",
  },
  communication: {
    monogram: "Co",
    accent: "rose",
  },
  "conflict-handling": {
    monogram: "Co",
    accent: "rose",
  },
  ownership: {
    monogram: "Ow",
    accent: "rose",
  },
  "decision-making": {
    monogram: "De",
    accent: "rose",
  },
  collaboration: {
    monogram: "Co",
    accent: "rose",
  },
  adaptability: {
    monogram: "Ad",
    accent: "rose",
  },
  accountability: {
    monogram: "Ac",
    accent: "rose",
  },
  leadership: {
    monogram: "Le",
    accent: "rose",
  },
  feedback: {
    monogram: "Fe",
    accent: "rose",
  },
  prioritization: {
    monogram: "Pr",
    accent: "rose",
  },
  "client-communication": {
    monogram: "Cl",
    accent: "rose",
  },
}
