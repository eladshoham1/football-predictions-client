import React, { useState, useMemo, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTeams, getMyGroupPredictions, getMyBracketPredictions, upsertBracketPredictions, getMyTournamentPrediction } from '../api'

interface Team {
  id: string
  name: string
  flagUrl: string | null
  code?: string
}

interface BracketMatch {
  id: string
  round: string
  position: number
  team1?: Team | null
  team2?: Team | null
}

export default function Bracket() {
  const [winners, setWinners] = useState<Record<string, Team>>({})
  const [tournamentWinner, setTournamentWinner] = useState<Team | null>(null)
  const [thirdPlaceWinner, setThirdPlaceWinner] = useState<Team | null>(null)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  const queryClient = useQueryClient()

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  const { data: groupPredictions } = useQuery({
    queryKey: ['groupPredictions'],
    queryFn: getMyGroupPredictions,
  })

  const { data: bracketPredictions, isLoading: isLoadingBracket } = useQuery({
    queryKey: ['bracketPredictions'],
    queryFn: getMyBracketPredictions,
  })

  const { data: tournamentPrediction } = useQuery({
    queryKey: ['tournamentPrediction'],
    queryFn: getMyTournamentPrediction,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate all required predictions are complete
      const requiredStages = {
        'r32': 16,
        'r16': 8,
        'qf': 4,
        'sf': 2
      }

      const stageCounts: Record<string, number> = {}
      Object.keys(winners).forEach(matchId => {
        const stage = matchId.split('-')[0]
        stageCounts[stage] = (stageCounts[stage] || 0) + 1
      })

      const missingStages: string[] = []
      Object.entries(requiredStages).forEach(([stage, required]) => {
        const count = stageCounts[stage] || 0
        if (count < required) {
          const stageNames: Record<string, string> = {
            'r32': 'שלב 32',
            'r16': 'שמינית גמר',
            'qf': 'רבע גמר',
            'sf': 'חצי גמר'
          }
          missingStages.push(`${stageNames[stage]} (${count}/${required})`)
        }
      })

      if (!tournamentWinner) {
        missingStages.push('זוכה הטורניר (גמר)')
      }

      if (!thirdPlaceWinner) {
        missingStages.push('מקום 3')
      }

      if (missingStages.length > 0) {
        throw new Error(`יש להשלים את כל השלבים:\n${missingStages.join('\n')}`)
      }

      // Prepare bracket predictions array
      const bracketPredictions = Object.entries(winners).map(([matchId, team]) => ({
        matchId: matchId.replace('r32-', 'R32_').replace('r16-', 'R16_').replace('qf-', 'QF_').replace('sf-', 'SF_'),
        predictedWinnerTeamId: (team as Team).id,
      }))

      // Single API call with all predictions
      return await upsertBracketPredictions({
        bracketPredictions,
        tournamentWinnerId: tournamentWinner!.id,
        thirdPlaceWinnerId: thirdPlaceWinner!.id
      })
    },
    onSuccess: () => {
      setSaveMessage({ type: 'success', text: 'ניחושי הפלייאוף נשמרו בהצלחה! 🎉' })
      setHasChanges(false)
      queryClient.invalidateQueries({ queryKey: ['bracketPredictions'] })
      queryClient.invalidateQueries({ queryKey: ['tournamentPrediction'] })
      setTimeout(() => setSaveMessage(null), 5000)
    },
    onError: (error: any) => {
      const errorMessage = error.message || error.response?.data?.message || 'שגיאה בשמירת הניחושים. נסו שוב.'
      setSaveMessage({ 
        type: 'error', 
        text: errorMessage
      })
      setTimeout(() => setSaveMessage(null), 8000)
    },
  })

  // Load existing predictions
  useEffect(() => {
    if (bracketPredictions && teams) {
      const loadedWinners: Record<string, Team> = {}
      
      bracketPredictions.forEach((pred: any) => {
        const team = teams.find((t: any) => t.id === pred.predictedTeamId)
        if (team) {
          // Convert match ID format back
          const matchId = pred.matchId
            .replace('R32_', 'r32-')
            .replace('R16_', 'r16-')
            .replace('QF_', 'qf-')
            .replace('SF_', 'sf-')
          
          if (matchId === 'THIRD_PLACE') {
            setThirdPlaceWinner(team)
          } else {
            loadedWinners[matchId] = team
          }
        }
      })
      
      setWinners(loadedWinners)
    }
  }, [bracketPredictions, teams])

  // Load tournament winner
  useEffect(() => {
    if (tournamentPrediction && teams) {
      const winner = teams.find((t: any) => t.id === tournamentPrediction.winnerTeamId)
      if (winner) {
        setTournamentWinner(winner)
      }
    }
  }, [tournamentPrediction, teams])

  // Get team by ID
  const getTeam = (teamId: string | undefined): Team | null => {
    if (!teamId || !teams) return null
    return teams.find((t: any) => t.id === teamId) || null
  }

  // Get team from group prediction
  const getGroupTeam = (groupName: string, position: number): Team | null => {
    const prediction = groupPredictions?.find((p: any) => p.groupName === groupName)
    if (!prediction) return null

    let teamId
    if (position === 1) teamId = prediction.firstPlaceTeamId
    else if (position === 2) teamId = prediction.secondPlaceTeamId
    else if (position === 3) teamId = prediction.thirdPlaceTeamId

    return getTeam(teamId)
  }

  const selectWinner = (matchId: string, team: Team) => {
    setWinners(prev => ({ ...prev, [matchId]: team }))
    setHasChanges(true)
  }

  const handleSaveTournamentWinner = (team: Team) => {
    setTournamentWinner(team)
    setHasChanges(true)
  }

  const handleSaveThirdPlace = (team: Team) => {
    setThirdPlaceWinner(team)
    setHasChanges(true)
  }

  const hasGroupPredictions = groupPredictions && groupPredictions.length > 0

  // Count how many predictions were made
  const predictionCount = Object.keys(winners).length + (tournamentWinner ? 1 : 0) + (thirdPlaceWinner ? 1 : 0)
  const totalRequired = 16 + 8 + 4 + 2 + 1 + 1 // R32 + R16 + QF + SF + Final + 3rd Place = 32
  const isComplete = predictionCount === totalRequired && tournamentWinner && thirdPlaceWinner

  // Build Round of 32
  const round32: BracketMatch[] = useMemo(() => {
    if (!hasGroupPredictions) return []
    return [
      { id: 'r32-1', round: 'R32', position: 1, team1: getGroupTeam('A', 1), team2: getGroupTeam('B', 2) },
      { id: 'r32-2', round: 'R32', position: 2, team1: getGroupTeam('C', 1), team2: getGroupTeam('D', 2) },
      { id: 'r32-3', round: 'R32', position: 3, team1: getGroupTeam('E', 1), team2: getGroupTeam('F', 2) },
      { id: 'r32-4', round: 'R32', position: 4, team1: getGroupTeam('G', 1), team2: getGroupTeam('H', 2) },
      { id: 'r32-5', round: 'R32', position: 5, team1: getGroupTeam('I', 1), team2: getGroupTeam('J', 2) },
      { id: 'r32-6', round: 'R32', position: 6, team1: getGroupTeam('K', 1), team2: getGroupTeam('L', 2) },
      { id: 'r32-7', round: 'R32', position: 7, team1: getGroupTeam('A', 2), team2: getGroupTeam('B', 1) },
      { id: 'r32-8', round: 'R32', position: 8, team1: getGroupTeam('C', 2), team2: getGroupTeam('D', 1) },
      { id: 'r32-9', round: 'R32', position: 9, team1: getGroupTeam('E', 2), team2: getGroupTeam('F', 1) },
      { id: 'r32-10', round: 'R32', position: 10, team1: getGroupTeam('G', 2), team2: getGroupTeam('H', 1) },
      { id: 'r32-11', round: 'R32', position: 11, team1: getGroupTeam('I', 2), team2: getGroupTeam('J', 1) },
      { id: 'r32-12', round: 'R32', position: 12, team1: getGroupTeam('K', 2), team2: getGroupTeam('L', 1) },
      // Third place teams (will be selected in group stage)
      { id: 'r32-13', round: 'R32', position: 13, team1: getGroupTeam('A', 3), team2: getGroupTeam('B', 3) },
      { id: 'r32-14', round: 'R32', position: 14, team1: getGroupTeam('C', 3), team2: getGroupTeam('D', 3) },
      { id: 'r32-15', round: 'R32', position: 15, team1: getGroupTeam('E', 3), team2: getGroupTeam('F', 3) },
      { id: 'r32-16', round: 'R32', position: 16, team1: getGroupTeam('G', 3), team2: getGroupTeam('H', 3) },
    ]
  }, [groupPredictions])

  // Build Round of 16
  const round16: BracketMatch[] = useMemo(() => {
    return [
      { id: 'r16-1', round: 'R16', position: 1, team1: winners['r32-1'], team2: winners['r32-2'] },
      { id: 'r16-2', round: 'R16', position: 2, team1: winners['r32-3'], team2: winners['r32-4'] },
      { id: 'r16-3', round: 'R16', position: 3, team1: winners['r32-5'], team2: winners['r32-6'] },
      { id: 'r16-4', round: 'R16', position: 4, team1: winners['r32-7'], team2: winners['r32-8'] },
      { id: 'r16-5', round: 'R16', position: 5, team1: winners['r32-9'], team2: winners['r32-10'] },
      { id: 'r16-6', round: 'R16', position: 6, team1: winners['r32-11'], team2: winners['r32-12'] },
      { id: 'r16-7', round: 'R16', position: 7, team1: winners['r32-13'], team2: winners['r32-14'] },
      { id: 'r16-8', round: 'R16', position: 8, team1: winners['r32-15'], team2: winners['r32-16'] },
    ]
  }, [winners])

  // Build Quarter Finals
  const quarterFinals: BracketMatch[] = useMemo(() => {
    return [
      { id: 'qf-1', round: 'QF', position: 1, team1: winners['r16-1'], team2: winners['r16-2'] },
      { id: 'qf-2', round: 'QF', position: 2, team1: winners['r16-3'], team2: winners['r16-4'] },
      { id: 'qf-3', round: 'QF', position: 3, team1: winners['r16-5'], team2: winners['r16-6'] },
      { id: 'qf-4', round: 'QF', position: 4, team1: winners['r16-7'], team2: winners['r16-8'] },
    ]
  }, [winners])

  // Build Semi Finals
  const semiFinals: BracketMatch[] = useMemo(() => {
    return [
      { id: 'sf-1', round: 'SF', position: 1, team1: winners['qf-1'], team2: winners['qf-2'] },
      { id: 'sf-2', round: 'SF', position: 2, team1: winners['qf-3'], team2: winners['qf-4'] },
    ]
  }, [winners])

  // Third Place Match
  const thirdPlaceMatch: BracketMatch | null = useMemo(() => {
    const loser1 = winners['sf-1'] ? (semiFinals[0]?.team1?.id === winners['sf-1'].id ? semiFinals[0]?.team2 : semiFinals[0]?.team1) : null
    const loser2 = winners['sf-2'] ? (semiFinals[1]?.team1?.id === winners['sf-2'].id ? semiFinals[1]?.team2 : semiFinals[1]?.team1) : null
    return { id: 'third', round: '3rd', position: 1, team1: loser1, team2: loser2 }
  }, [winners, semiFinals])

  // Final Match
  const finalMatch: BracketMatch | null = useMemo(() => {
    return { id: 'final', round: 'Final', position: 1, team1: winners['sf-1'], team2: winners['sf-2'] }
  }, [winners])

  if (!hasGroupPredictions) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-black gradient-text">עץ הפלייאוף</h1>
          <p className="text-slate-600 mt-2">נחשו מי ינצח בכל שלב עד לזוכה הגדול</p>
        </div>
        <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center">
          <div className="text-4xl mb-3">👥</div>
          <h3 className="text-lg font-bold text-blue-900 mb-2">תחילה בצעו ניחושי קבוצות</h3>
          <p className="text-blue-700 mb-4">
            כדי לראות את עץ הפלייאוף, תחילה בצעו ניחושים עבור שלב הקבוצות
          </p>
          <a href="#groups" className="btn-primary inline-block">
            ← לעמוד הקבוצות
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black gradient-text">עץ הפלייאוף</h1>
        <p className="text-slate-600 mt-2">נחשו מי ינצח בכל שלב עד לזוכה הגדול</p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">🏆</div>
          <div className="text-sm text-yellow-900">
            <strong>איך זה עובד:</strong> בחרו את הקבוצה המנצחת בכל משחק. המנצחים יעברו לשלב הבא אוטומטית עד לגמר.
          </div>
        </div>
      </div>

      {/* Save Button */}
      {predictionCount > 0 && (
        <div className="sticky top-16 z-20 bg-white rounded-xl shadow-lg border-2 border-primary-300 p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm flex-1">
              <div className="font-bold text-slate-800">
                {predictionCount} / {totalRequired} ניחושים נבחרו
              </div>
              {!isComplete && (
                <div className="text-orange-600 text-xs mt-1">
                  ⚠️ יש להשלים את כל השלבים (כולל גמר ומקום 3)
                </div>
              )}
              {hasChanges && isComplete && (
                <div className="text-blue-600 text-xs mt-1">
                  💾 יש שינויים שלא נשמרו
                </div>
              )}
            </div>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !hasChanges || !isComplete}
              className={`btn-primary flex items-center gap-2 whitespace-nowrap ${
                saveMutation.isPending || !hasChanges || !isComplete ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!isComplete ? 'יש להשלים את כל השלבים לפני השמירה' : ''}
            >
              {saveMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>שומר...</span>
                </>
              ) : (
                <>
                  <span>💾</span>
                  <span>שמור הכל</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Success/Error Message */}
      {saveMessage && (
        <div
          className={`rounded-xl p-4 border-2 animate-fade-in ${
            saveMessage.type === 'success'
              ? 'bg-green-50 border-green-300 text-green-800'
              : 'bg-red-50 border-red-300 text-red-800'
          }`}
        >
          <div className="flex items-start gap-2">
            <span className="text-xl flex-shrink-0 mt-0.5">{saveMessage.type === 'success' ? '✅' : '❌'}</span>
            <div className="font-semibold whitespace-pre-line flex-1">{saveMessage.text}</div>
          </div>
        </div>
      )}

      {/* Desktop: Horizontal Tree Layout */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="min-w-max p-4">
          <BracketTree
            round32={round32}
            round16={round16}
            quarterFinals={quarterFinals}
            semiFinals={semiFinals}
            thirdPlaceMatch={thirdPlaceMatch}
            finalMatch={finalMatch}
            winners={winners}
            onSelectWinner={selectWinner}
            tournamentWinner={tournamentWinner}
            setTournamentWinner={handleSaveTournamentWinner}
            thirdPlaceWinner={thirdPlaceWinner}
            setThirdPlaceWinner={handleSaveThirdPlace}
          />
        </div>
      </div>

      {/* Mobile: Vertical Stages */}
      <div className="lg:hidden space-y-6">
        <RoundSection title="⚽ שלב 32" matches={round32} winners={winners} onSelectWinner={selectWinner} />
        <RoundSection title="🎯 שמינית גמר" matches={round16} winners={winners} onSelectWinner={selectWinner} />
        <RoundSection title="🔥 רבע גמר" matches={quarterFinals} winners={winners} onSelectWinner={selectWinner} />
        <RoundSection title="⭐ חצי גמר" matches={semiFinals} winners={winners} onSelectWinner={selectWinner} />
        
        {thirdPlaceMatch && (
          <div className="card">
            <h3 className="text-lg font-bold mb-4">🥉 מקום 3</h3>
            <MatchCard match={thirdPlaceMatch} winner={thirdPlaceWinner} onSelect={handleSaveThirdPlace} />
          </div>
        )}

        {finalMatch && (
          <div className="card bg-gradient-to-r from-yellow-50 to-amber-50 border-4 border-yellow-400">
            <h3 className="text-2xl font-black mb-4 text-center gradient-text">🏆 הגמר הגדול</h3>
            <MatchCard match={finalMatch} winner={tournamentWinner} onSelect={handleSaveTournamentWinner} isChampion />
          </div>
        )}

        {tournamentWinner && (
          <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-4 border-green-400 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-2xl font-black mb-2">אלופת המונדיאל!</h3>
            <TeamDisplay team={tournamentWinner} large />
          </div>
        )}
      </div>
    </div>
  )
}

// Desktop Horizontal Tree
function BracketTree({
  round32,
  round16,
  quarterFinals,
  semiFinals,
  thirdPlaceMatch,
  finalMatch,
  winners,
  onSelectWinner,
  tournamentWinner,
  setTournamentWinner,
  thirdPlaceWinner,
  setThirdPlaceWinner,
}: any) {
  const matchHeight = 64
  const gap = 12
  const unit = matchHeight + gap // Single unit of spacing (76px)
  
  return (
    <div className="flex gap-6 py-4">
      {/* Round of 32 */}
      <div className="flex flex-col" style={{ minWidth: '160px' }}>
        <h3 className="text-center font-bold text-sm mb-4 h-8">⚽ שלב 32</h3>
        <div className="flex flex-col" style={{ gap: `${gap}px` }}>
          {round32.map((match: BracketMatch) => (
            <div key={match.id} style={{ height: `${matchHeight}px` }}>
              <MatchCard match={match} winner={winners[match.id]} onSelect={(team) => onSelectWinner(match.id, team)} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Round of 16 - Each match centered between 2 R32 matches */}
      <div className="flex flex-col" style={{ minWidth: '160px' }}>
        <h3 className="text-center font-bold text-sm mb-4 h-8">🎯 שמינית גמר</h3>
        <div className="flex flex-col" style={{ 
          gap: `${unit * 2}px`,
          marginTop: `${unit * 0.5}px`
        }}>
          {round16.map((match: BracketMatch) => (
            <div key={match.id} style={{ height: `${matchHeight}px` }}>
              <MatchCard match={match} winner={winners[match.id]} onSelect={(team) => onSelectWinner(match.id, team)} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Quarter Finals - Each match centered between 2 R16 matches */}
      <div className="flex flex-col" style={{ minWidth: '160px' }}>
        <h3 className="text-center font-bold text-sm mb-4 h-8">🔥 רבע גמר</h3>
        <div className="flex flex-col" style={{ 
          gap: `${unit * 4}px`,
          marginTop: `${unit * 1.5}px`
        }}>
          {quarterFinals.map((match: BracketMatch) => (
            <div key={match.id} style={{ height: `${matchHeight}px` }}>
              <MatchCard match={match} winner={winners[match.id]} onSelect={(team) => onSelectWinner(match.id, team)} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Semi Finals - Each match centered between 2 QF matches */}
      <div className="flex flex-col" style={{ minWidth: '160px' }}>
        <h3 className="text-center font-bold text-sm mb-4 h-8">⭐ חצי גמר</h3>
        <div className="flex flex-col" style={{ 
          gap: `${unit * 8}px`,
          marginTop: `${unit * 3.5}px`
        }}>
          {semiFinals.map((match: BracketMatch) => (
            <div key={match.id} style={{ height: `${matchHeight}px` }}>
              <MatchCard match={match} winner={winners[match.id]} onSelect={(team) => onSelectWinner(match.id, team)} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Final Column - Centered between SF matches */}
      <div className="flex flex-col gap-4" style={{ minWidth: '180px' }}>
        <div className="h-8 mb-4" /> {/* Spacer to align with other titles */}
        
        <div style={{ marginTop: `${unit * 7.5}px` }}>
          {/* Third Place */}
          {thirdPlaceMatch && (
            <div className="mb-6">
              <h3 className="text-center font-bold text-xs mb-2 text-slate-600">🥉 מקום 3</h3>
              <MatchCard match={thirdPlaceMatch} winner={thirdPlaceWinner} onSelect={setThirdPlaceWinner} compact />
            </div>
          )}

          {/* Final */}
          {finalMatch && (
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-xl p-3 border-4 border-yellow-400 shadow-lg">
              <h3 className="text-center font-black text-base mb-3 gradient-text">🏆 גמר</h3>
              <MatchCard match={finalMatch} winner={tournamentWinner} onSelect={setTournamentWinner} isChampion compact />
            </div>
          )}

          {/* Winner */}
          {tournamentWinner && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-3 border-4 border-green-400 text-center shadow-lg mt-4">
              <div className="text-4xl mb-2">🏆</div>
              <div className="text-xs font-bold mb-1">אלוף!</div>
              <TeamDisplay team={tournamentWinner} large />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Round Section (Mobile)
function RoundSection({ title, matches, winners, onSelectWinner }: any) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold mb-4">{title}</h3>
      <div className="space-y-3">
        {matches.map((match: BracketMatch) => (
          <MatchCard key={match.id} match={match} winner={winners[match.id]} onSelect={(team) => onSelectWinner(match.id, team)} />
        ))}
      </div>
    </div>
  )
}

// Match Card Component
function MatchCard({ match, winner, onSelect, compact = false, isChampion = false }: any) {
  if (!match.team1 || !match.team2) {
    return (
      <div className={`bg-slate-100 rounded-lg p-3 text-center text-slate-400 text-xs ${compact ? 'h-16' : 'h-20'}`}>
        ממתינים למנצחים
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg border-2 ${isChampion ? 'border-yellow-400' : 'border-slate-200'} overflow-hidden ${compact ? '' : 'shadow-sm'}`}>
      <button
        onClick={() => onSelect(match.team1)}
        className={`w-full p-2 flex items-center gap-2 border-b transition-all ${
          winner?.id === match.team1.id
            ? 'bg-primary-100 border-primary-400 border-l-4'
            : 'hover:bg-slate-50 border-slate-100'
        } ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <TeamDisplay team={match.team1} compact={compact} />
        {winner?.id === match.team1.id && <span className="mr-auto text-green-600 font-bold">✓</span>}
      </button>
      <button
        onClick={() => onSelect(match.team2)}
        className={`w-full p-2 flex items-center gap-2 transition-all ${
          winner?.id === match.team2.id
            ? 'bg-primary-100 border-primary-400 border-l-4'
            : 'hover:bg-slate-50'
        } ${compact ? 'text-xs' : 'text-sm'}`}
      >
        <TeamDisplay team={match.team2} compact={compact} />
        {winner?.id === match.team2.id && <span className="mr-auto text-green-600 font-bold">✓</span>}
      </button>
    </div>
  )
}

// Team Display Component
function TeamDisplay({ team, compact = false, large = false }: { team: Team; compact?: boolean; large?: boolean }) {
  const size = large ? 'h-10 w-14' : compact ? 'h-4 w-6' : 'h-6 w-8'
  const textSize = large ? 'text-lg' : compact ? 'text-xs' : 'text-sm'

  return (
    <div className="flex items-center gap-2 min-w-0 flex-1">
      {team.flagUrl ? (
        <img 
          src={team.flagUrl} 
          alt={team.name}
          className={`${size} object-cover rounded shadow-sm flex-shrink-0`}
        />
      ) : (
        <div className={`${size} bg-slate-200 rounded flex items-center justify-center text-xs flex-shrink-0`}>
          ?
        </div>
      )}
      <span className={`font-semibold text-slate-800 truncate ${textSize}`}>
        {team.code || team.name}
      </span>
    </div>
  )
}
