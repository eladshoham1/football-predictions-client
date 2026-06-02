import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
const API = axios.create({ baseURL: API_URL })

export function setToken(t: string | null) {
	API.defaults.headers.common.Authorization = t ? `Bearer ${t}` : undefined
}

// Auth
export const getMe = async () => {
	const r = await API.get('/auth/me')
	return r.data
}

// Matches
export const fetchMatches = async () => {
	const r = await API.get('/matches')
	return r.data
}

// Teams
export const fetchTeams = async () => {
	const r = await API.get('/teams')
	return r.data
}

// Players
export const fetchPlayers = async () => {
	const r = await API.get('/teams/players')
	return r.data
}

// Leaderboard
export const fetchLeaderboard = async () => {
	const r = await API.get('/leaderboard')
	return r.data
}

// Match Predictions
export const upsertMatchPrediction = async (body: { matchId: string; homeScore: number; awayScore: number; firstGoalScorerId?: string }) => {
	const r = await API.post('/predictions/match', body)
	return r.data
}

export const getMyMatchPredictions = async () => {
	const r = await API.get('/predictions/match')
	return r.data
}

export const getMatchPredictions = async (matchId: string) => {
	const r = await API.get(`/predictions/match/all?matchId=${matchId}`)
	return r.data
}

// Group Predictions
export const upsertGroupPrediction = async (body: { groupName: string; firstPlaceTeamId: string; secondPlaceTeamId: string; thirdPlaceTeamId?: string; fourthPlaceTeamId?: string }) => {
	const r = await API.post('/predictions/group', body)
	return r.data
}

export const upsertGroupPredictions = async (predictions: Array<{ groupName: string; firstPlaceTeamId: string; secondPlaceTeamId: string; thirdPlaceTeamId?: string; fourthPlaceTeamId?: string }>) => {
	const r = await API.post('/predictions/groups', { predictions })
	return r.data
}

export const getMyGroupPredictions = async () => {
	const r = await API.get('/predictions/group')
	return r.data
}

export const getGroupLockStatus = async () => {
	const r = await API.get('/predictions/group-lock-status')
	return r.data
}

// Bracket Predictions
export const upsertBracketPrediction = async (body: { matchId: string; predictedWinnerTeamId: string }) => {
	const r = await API.post('/predictions/bracket', body)
	return r.data
}

export const upsertBracketPredictions = async (body: {
	bracketPredictions: Array<{ matchId: string; predictedWinnerTeamId: string }>
	tournamentWinnerId: string
	thirdPlaceWinnerId: string
}) => {
	const r = await API.post('/predictions/brackets', body)
	return r.data
}

export const getMyBracketPredictions = async () => {
	const r = await API.get('/predictions/bracket')
	return r.data
}

// Tournament Predictions
export const upsertTournamentPrediction = async (body: { winnerTeamId: string; goldenBootPlayerId?: string }) => {
	const r = await API.post('/predictions/tournament', body)
	return r.data
}

export const getMyTournamentPrediction = async () => {
	const r = await API.get('/predictions/tournament')
	return r.data
}

// Admin
export const syncMatches = async () => {
	const r = await API.post('/worldcup/sync')
	return r.data
}

export default API
