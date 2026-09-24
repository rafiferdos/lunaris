import { userBaseline } from "@/features/profile/profile-service"
export interface RankedUser {
  id: string
  name: string
  username: string
  rating: number
  xp: number
  accuracy: number
  assessments: number
  streak: number
  integrity: number
  rank: number
  movement: number
}
const names = [
  "Sofia Chen",
  "Arjun Mehta",
  "Elena Petrova",
  "Noah Williams",
  "Amara Okafor",
  "Lucas Martin",
  "Yuki Tanaka",
  "Zara Ahmed",
  "Oliver Kim",
  "Maya Patel",
  "Daniel Silva",
  "Leila Hassan",
  "Ethan Brooks",
  "Priya Nair",
  "Mateo Garcia",
  "Ava Wilson",
  "Omar Farouk",
  "Lena Fischer",
  "Jin Park",
  "Isla Campbell",
]
export const leaderboardService = {
  getLeaderboard: ({
    period,
    category,
    difficulty,
    topic,
  }: {
    period: string
    category: string
    difficulty: string
    topic: string
  }): { users: RankedUser[]; current: RankedUser; total: number } => {
    const scope =
      period.length + category.length + difficulty.length + topic.length
    const overall =
      period === "weekly" &&
      category === "Overall" &&
      difficulty === "all" &&
      topic === "all"
    const users = names
      .map((name, index) => ({
        id: `rank-${index}`,
        name,
        username: name.toLowerCase().replace(" ", ""),
        rating: 2194 - index * 23 + (overall ? 0 : (scope * (index + 1)) % 31),
        xp: 6430 - index * 147,
        accuracy: 96 - (index % 9),
        assessments: 54 - index,
        streak: 18 - (index % 12),
        integrity: 100 - (index % 3),
        rank: index + 1,
        movement: index % 4 === 0 ? -2 : (index % 5) + 1,
      }))
      .sort((a, b) => b.rating - a.rating)
      .map((user, index) => ({ ...user, rank: index + 1 }))
    return {
      users,
      current: {
        id: userBaseline.id,
        name: "Rafi Ferdos",
        username: "rafiferdos",
        rating: userBaseline.rating,
        xp: userBaseline.xp,
        accuracy: 80,
        assessments: 12,
        streak: userBaseline.streak,
        integrity: 98,
        rank: overall ? userBaseline.rank : 82 + scope,
        movement: 12,
      },
      total: 1640,
    }
  },
}
