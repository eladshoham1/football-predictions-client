import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMatches, fetchLeaderboard, fetchTeams, getMyMatchPredictions, upsertMatchPrediction } from '../api'

export function useMatches() {
  return useQuery({ queryKey: ['matches'], queryFn: fetchMatches, staleTime: 1000 * 60 })
}

export function useLeaderboard() {
  return useQuery({ queryKey: ['leaderboard'], queryFn: fetchLeaderboard, staleTime: 1000 * 30 })
}

export function useTeams() {
  return useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
}

export function useMyPredictions() {
  return useQuery({ queryKey: ['myPredictions'], queryFn: getMyMatchPredictions })
}

export function useUpsertPrediction() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: upsertMatchPrediction, onSuccess() { qc.invalidateQueries({ queryKey: ['myPredictions'] }); qc.invalidateQueries({ queryKey: ['leaderboard'] }) } })
}
