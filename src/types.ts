export type Team = {
  id: string
  name: string
  flag?: string | null
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
  pointsTotal: number
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
