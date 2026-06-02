export type Team = {
  id: string
  name: string
  hebrewName?: string | null
  flag?: string | null
}

export type Player = {
  id: string
  name: string
  position?: string | null
  team: {
    id: string
    name: string
    hebrewName?: string | null
    code: string
    flagUrl: string | null
  }
}

export type Match = {
  id: string
  kickoffAt: string
  homeTeam: Team
  awayTeam: Team
  homeScore?: number | null
  awayScore?: number | null
}

export type Prediction = {
  id: string
  matchId: string
  userId: string
  homeScorePred: number
  awayScorePred: number
  firstGoalScorerId?: string | null
  pointsTotal: number
}

export type UserPrediction = {
  id: string
  matchId: string
  predictedHomeScore: number
  predictedAwayScore: number
  firstGoalScorerId?: string | null
  pointsAwarded: number
  user: {
    id: string
    name: string
    avatarUrl?: string | null
  }
  firstGoalScorer?: {
    id: string
    name: string
  } | null
}

export type User = {
  id: string
  email: string
  name: string
  avatarUrl?: string | null
}

export type LeaderboardEntry = {
  userId: string
  name: string
  points: number
  exactCount: number
  scoringCount: number
  rank: number
}
