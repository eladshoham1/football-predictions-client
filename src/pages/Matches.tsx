import React, { useState, useEffect } from 'react'
import { useMatches, useMyPredictions, useUpsertPrediction } from '../services/hooks'
import { getTeamDisplayName } from '../utils/teamUtils'
import { getStageDisplayName, getStatusDisplayName } from '../utils/hebrewUtils'
import { fetchPlayers, getMatchPredictions } from '../api'
import { Player, UserPrediction } from '../types'

export default function Matches() {
  const { data: matches, isLoading } = useMatches()
  const { data: predictions } = useMyPredictions()
  const upsertMutation = useUpsertPrediction()
  const [scores, setScores] = useState<Record<string, { home: string; away: string; firstGoalScorerId?: string }>>({})
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [expandedMatch, setExpandedMatch] = useState<string | null>(null)
  const [expandedPredictions, setExpandedPredictions] = useState<string | null>(null)
  const [matchPredictions, setMatchPredictions] = useState<Record<string, UserPrediction[]>>({})
  const [loadingPredictions, setLoadingPredictions] = useState<Record<string, boolean>>({})
  const [loadingPlayers, setLoadingPlayers] = useState(true)

  // Load all players on mount
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await fetchPlayers()
        setAllPlayers(players)
      } catch (error) {
        console.error('Failed to load players:', error)
      } finally {
        setLoadingPlayers(false)
      }
    }
    loadPlayers()
  }, [])

  const getPrediction = (matchId: string) => {
    return predictions?.find((p: any) => p.matchId === matchId)
  }

  const getMatchPlayers = (homeTeamId: string, awayTeamId: string): Player[] => {
    return allPlayers.filter(
      (player) => player.team.id === homeTeamId || player.team.id === awayTeamId
    )
  }

  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: '0', away: '0' }),
        [team]: value,
      },
    }))
  }

  const handleFirstGoalScorerChange = (matchId: string, playerId: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: '0', away: '0' }),
        firstGoalScorerId: playerId === 'none' ? undefined : playerId,
      },
    }))
  }

  const handleSubmit = (matchId: string) => {
    const score = scores[matchId]
    if (!score) return

    // Allow empty fields - treat them as 0
    const homeScore = score.home === '' ? 0 : parseInt(score.home)
    const awayScore = score.away === '' ? 0 : parseInt(score.away)

    upsertMutation.mutate({
      matchId,
      homeScore,
      awayScore,
      firstGoalScorerId: score.firstGoalScorerId,
    })
  }

  const togglePredictionsView = async (matchId: string) => {
    // If already expanded, just collapse
    if (expandedPredictions === matchId) {
      setExpandedPredictions(null)
      return
    }

    // Expand and fetch predictions if not already loaded
    setExpandedPredictions(matchId)
    
    if (!matchPredictions[matchId]) {
      setLoadingPredictions({ ...loadingPredictions, [matchId]: true })
      try {
        const preds = await getMatchPredictions(matchId)
        setMatchPredictions({ ...matchPredictions, [matchId]: preds })
      } catch (error) {
        console.error('Failed to load predictions:', error)
      } finally {
        setLoadingPredictions({ ...loadingPredictions, [matchId]: false })
      }
    }
  }

  const isMatchLocked = (kickoffTime: string) => {
    return new Date(kickoffTime) <= new Date()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('he-IL', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: 'Asia/Jerusalem',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jerusalem',
    })
  }

  if (isLoading || loadingPlayers) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black gradient-text">ניחושי משחקים</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Group matches by date
  const matchesByDate: Record<string, any[]> = {}
  matches?.forEach((match: any) => {
    const dateKey = formatDate(match.kickoffTime)
    if (!matchesByDate[dateKey]) {
      matchesByDate[dateKey] = []
    }
    matchesByDate[dateKey].push(match)
  })

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-2xl md:text-3xl font-black gradient-text">ניחושי משחקים</h1>
        <div className="badge badge-info text-sm">
          {matches?.length || 0} משחקים בסה״כ
        </div>
      </div>

      {Object.entries(matchesByDate).map(([date, dayMatches]) => (
        <div key={date} className="space-y-3">
          {/* Date Header */}
          <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2 px-1">
            <span className="text-xl md:text-2xl">📅</span>
            {date}
          </h2>

          <div className="space-y-3">
            {dayMatches.map((match: any) => {
              const prediction = getPrediction(match.id)
              const locked = isMatchLocked(match.kickoffTime)
              const currentScore = scores[match.id] || {
                home: prediction?.predictedHomeScore?.toString() || '0',
                away: prediction?.predictedAwayScore?.toString() || '0',
                firstGoalScorerId: prediction?.firstGoalScorerId,
              }
              const matchPlayers = getMatchPlayers(match.homeTeam.id, match.awayTeam.id)
              const isExpanded = expandedMatch === match.id

              return (
                <div key={match.id} className="card hover:shadow-xl transition-all duration-300">
                  {/* Header Bar - Stage, Time & Status */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      {match.stage && (
                        <span className="badge badge-primary text-xs font-semibold">
                          {getStageDisplayName(match.stage)}
                        </span>
                      )}
                      {match.groupName && (
                        <span className="badge badge-info text-xs">
                          קבוצה {match.groupName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm md:text-base font-semibold text-slate-700">
                        {formatTime(match.kickoffTime)}
                      </div>
                      {locked && (
                        <span className="badge badge-danger text-xs">🔒 נעול</span>
                      )}
                      {match.status === 'LIVE' && (
                        <span className="badge badge-success text-xs animate-pulse">🔴 חי</span>
                      )}
                      {match.status === 'FINISHED' && (
                        <span className="badge badge-secondary text-xs">✓ הסתיים</span>
                      )}
                    </div>
                  </div>

                  {/* Match Content */}
                  <div className="flex flex-col gap-4">
                    {/* Teams & Score Row */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-bold text-slate-900 text-right text-sm md:text-lg truncate">
                          {getTeamDisplayName(match.homeTeam)}
                        </span>
                        {match.homeTeam.flagUrl ? (
                          <img
                            src={match.homeTeam.flagUrl}
                            alt={match.homeTeam.name}
                            className="w-10 h-7 md:w-12 md:h-9 object-cover rounded shadow-md flex-shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="text-3xl md:text-4xl flex-shrink-0">⚽</div>
                        )}
                      </div>

                      {/* Score Display/Input */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {match.status === 'FINISHED' ? (
                          <div className="flex items-center gap-3 text-2xl md:text-3xl font-black">
                            <span className="gradient-text">{match.homeScore}</span>
                            <span className="text-slate-300">-</span>
                            <span className="gradient-text">{match.awayScore}</span>
                          </div>
                        ) : locked ? (
                          <div className="flex items-center gap-2 text-xl md:text-2xl font-bold text-slate-600">
                            <span>{currentScore.home}</span>
                            <span className="text-slate-400">:</span>
                            <span>{currentScore.away}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min="0"
                              max="20"
                              value={currentScore.home}
                              onChange={(e) => handleScoreChange(match.id, 'home', e.target.value)}
                              className="score-input text-center"
                              placeholder="0"
                            />
                            <span className="text-2xl md:text-3xl font-bold text-slate-400">:</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min="0"
                              max="20"
                              value={currentScore.away}
                              onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                              className="score-input text-center"
                              placeholder="0"
                            />
                          </div>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-2 flex-1">
                        {match.awayTeam.flagUrl ? (
                          <img
                            src={match.awayTeam.flagUrl}
                            alt={match.awayTeam.name}
                            className="w-10 h-7 md:w-12 md:h-9 object-cover rounded shadow-md flex-shrink-0 border border-slate-200"
                          />
                        ) : (
                          <div className="text-3xl md:text-4xl flex-shrink-0">⚽</div>
                        )}
                        <span className="font-bold text-slate-900 text-sm md:text-lg truncate">
                          {getTeamDisplayName(match.awayTeam)}
                        </span>
                      </div>
                    </div>

                    {/* First Goal Scorer Section - Only show if match not locked */}
                    {!locked && match.status !== 'FINISHED' && (
                      <div className="pt-3 border-t border-slate-200">
                        <button
                          onClick={() => setExpandedMatch(isExpanded ? null : match.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                            currentScore.firstGoalScorerId 
                              ? 'bg-green-50 border border-green-200 hover:bg-green-100' 
                              : 'bg-amber-50 border border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          <span className="flex items-center gap-2 flex-1">
                            <span className="text-xl">⚽</span>
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-bold text-slate-800">שחקן שיכבוש שער ראשון</span>
                              {currentScore.firstGoalScorerId ? (
                                <span className="text-xs text-green-700 font-semibold">
                                  ✓ {matchPlayers.find(p => p.id === currentScore.firstGoalScorerId)?.name || 'נבחר'}
                                </span>
                              ) : (
                                <span className="text-xs text-amber-700 font-medium">
                                  💡 אופציונלי - הוסף לניחוש שלך
                                </span>
                              )}
                            </div>
                            {!currentScore.firstGoalScorerId && (
                              <span className="badge bg-amber-100 text-amber-700 border-amber-300 text-xs animate-pulse">
                                לא נבחר
                              </span>
                            )}
                          </span>
                          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {isExpanded && (
                          <div className="mt-3 max-h-64 overflow-y-auto bg-slate-50 rounded-lg p-3 space-y-2">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <p className="text-xs text-blue-800 font-medium">
                                💡 <strong>טיפ:</strong> בחר שחקן ותקבל נקודות בונוס אם הוא יכבוש ראשון!
                              </p>
                            </div>
                            <label className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                              <input
                                type="radio"
                                name={`first-goal-${match.id}`}
                                value="none"
                                checked={!currentScore.firstGoalScorerId}
                                onChange={(e) => handleFirstGoalScorerChange(match.id, e.target.value)}
                                className="w-4 h-4 text-slate-600"
                              />
                              <span className="text-sm text-slate-600 font-medium">דלג על בחירה זו</span>
                            </label>
                            {matchPlayers.length > 0 ? (
                              matchPlayers.map((player) => (
                                <label
                                  key={player.id}
                                  className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${
                                    currentScore.firstGoalScorerId === player.id
                                      ? 'bg-blue-100 border-2 border-blue-400 shadow-md'
                                      : 'bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm'
                                  }`}
                                >
                                  <input
                                    type="radio"
                                    name={`first-goal-${match.id}`}
                                    value={player.id}
                                    checked={currentScore.firstGoalScorerId === player.id}
                                    onChange={(e) => handleFirstGoalScorerChange(match.id, e.target.value)}
                                    className="w-5 h-5 text-blue-600"
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <span className={`text-sm font-semibold ${
                                      currentScore.firstGoalScorerId === player.id 
                                        ? 'text-blue-900' 
                                        : 'text-slate-800'
                                    }`}>
                                      {player.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                      ({getTeamDisplayName(player.team)})
                                    </span>
                                    {player.position && (
                                      <span className="text-xs badge badge-outline">{player.position}</span>
                                    )}
                                    {currentScore.firstGoalScorerId === player.id && (
                                      <span className="text-blue-600 text-sm ml-auto">✓</span>
                                    )}
                                  </div>
                                </label>
                              ))
                            ) : (
                              <p className="text-sm text-slate-500 text-center py-4">
                                אין שחקנים זמינים למשחק זה
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* All Predictions Section - Only show for locked/started matches */}
                    {locked && (
                      <div className="pt-3 border-t border-slate-200">
                        <button
                          onClick={() => togglePredictionsView(match.id)}
                          className="w-full flex items-center justify-between text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-lg">👥</span>
                            <span>ניחושי כל המשתתפים</span>
                            {matchPredictions[match.id] && (
                              <span className="badge badge-info text-xs">
                                {matchPredictions[match.id].length}
                              </span>
                            )}
                          </span>
                          <span className={`transform transition-transform ${expandedPredictions === match.id ? 'rotate-180' : ''}`}>
                            ▼
                          </span>
                        </button>

                        {expandedPredictions === match.id && (
                          <div className="mt-3 max-h-96 overflow-y-auto bg-slate-50 rounded-lg p-3">
                            {loadingPredictions[match.id] ? (
                              <div className="flex items-center justify-center py-8">
                                <span className="animate-spin text-2xl">⏳</span>
                                <span className="ml-2 text-slate-600">טוען ניחושים...</span>
                              </div>
                            ) : matchPredictions[match.id]?.length > 0 ? (
                              <div className="space-y-2">
                                {matchPredictions[match.id].map((pred, index) => {
                                  const isExact = match.status === 'FINISHED' && 
                                    pred.predictedHomeScore === match.homeScore && 
                                    pred.predictedAwayScore === match.awayScore
                                  const isCorrectOutcome = match.status === 'FINISHED' &&
                                    !isExact &&
                                    ((pred.predictedHomeScore > pred.predictedAwayScore && match.homeScore > match.awayScore) ||
                                     (pred.predictedHomeScore < pred.predictedAwayScore && match.homeScore < match.awayScore) ||
                                     (pred.predictedHomeScore === pred.predictedAwayScore && match.homeScore === match.awayScore))

                                  return (
                                    <div
                                      key={pred.id}
                                      className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                                        isExact
                                          ? 'bg-green-100 border-2 border-green-400'
                                          : isCorrectOutcome
                                          ? 'bg-blue-50 border border-blue-200'
                                          : 'bg-white hover:bg-slate-50'
                                      }`}
                                    >
                                      {/* User Info */}
                                      <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="flex-shrink-0">
                                          {pred.user.avatarUrl ? (
                                            <img
                                              src={pred.user.avatarUrl}
                                              alt={pred.user.name}
                                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-slate-200"
                                            />
                                          ) : (
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm md:text-base">
                                              {pred.user.name.charAt(0).toUpperCase()}
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-800 text-sm md:text-base truncate">
                                              {pred.user.name}
                                            </span>
                                            {index === 0 && match.status === 'FINISHED' && (
                                              <span className="text-xs">🥇</span>
                                            )}
                                          </div>
                                          {pred.firstGoalScorer && (
                                            <span className="text-xs text-slate-500 truncate">
                                              ⚽ {pred.firstGoalScorer.name}
                                            </span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Prediction Score */}
                                      <div className="flex items-center gap-3 flex-shrink-0">
                                        <div className={`flex items-center gap-2 font-bold text-base md:text-lg ${
                                          isExact ? 'text-green-700' : isCorrectOutcome ? 'text-blue-700' : 'text-slate-700'
                                        }`}>
                                          <span>{pred.predictedHomeScore}</span>
                                          <span className="text-slate-400">:</span>
                                          <span>{pred.predictedAwayScore}</span>
                                        </div>
                                        
                                        {/* Points - only show if match finished */}
                                        {match.status === 'FINISHED' && (
                                          <div className="text-center min-w-[3rem]">
                                            <div className={`text-lg md:text-xl font-black ${
                                              isExact ? 'text-green-600' : isCorrectOutcome ? 'text-blue-600' : 'text-slate-500'
                                            }`}>
                                              +{pred.pointsAwarded}
                                            </div>
                                            {isExact && (
                                              <div className="text-xs text-green-600 font-semibold">מדויק!</div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            ) : (
                              <div className="text-center py-8">
                                <div className="text-4xl mb-2">🤷</div>
                                <p className="text-slate-600 text-sm">אין ניחושים למשחק זה</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Row */}
                    <div className="flex flex-col gap-2 pt-3 border-t border-slate-200">
                      {!locked && match.status !== 'FINISHED' ? (
                        <>
                          <button
                            onClick={() => handleSubmit(match.id)}
                            disabled={upsertMutation.isPending}
                            className="btn-primary w-full text-base font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {upsertMutation.isPending ? (
                              <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin">⏳</span>
                                שולח...
                              </span>
                            ) : prediction ? (
                              '✏️ עדכון ניחוש'
                            ) : (
                              '📤 שליחת ניחוש'
                            )}
                          </button>
                          {!currentScore.firstGoalScorerId && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex items-center gap-2">
                              <span className="text-amber-600 text-sm">💡</span>
                              <span className="text-xs text-amber-800 font-medium">
                                רוצה לקבל נקודות נוספות? בחר שחקן שער ראשון למעלה
                              </span>
                            </div>
                          )}
                        </>
                      ) : prediction && match.status === 'FINISHED' ? (
                        <div className="flex items-center justify-between w-full bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-slate-500 font-medium">הניחוש שלך:</span>
                            <span className="text-sm font-bold text-slate-700">
                              {prediction.predictedHomeScore} : {prediction.predictedAwayScore}
                            </span>
                            {prediction.firstGoalScorer && (
                              <span className="text-xs text-slate-600">
                                ⚽ {prediction.firstGoalScorer.name}
                              </span>
                            )}
                          </div>
                          <div className="text-center">
                            <div className="text-3xl md:text-4xl font-black gradient-text">
                              +{prediction.pointsAwarded || 0}
                            </div>
                            <div className="text-xs text-slate-500 font-semibold">נקודות</div>
                          </div>
                        </div>
                      ) : locked && prediction ? (
                        <div className="flex items-center justify-between w-full text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
                          <span className="font-medium">
                            הניחוש שלך: {prediction.predictedHomeScore} : {prediction.predictedAwayScore}
                          </span>
                          {prediction.firstGoalScorer && (
                            <span className="text-xs">⚽ {prediction.firstGoalScorer.name}</span>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!matches?.length && (
        <div className="text-center py-20">
          <div className="text-7xl mb-6">⚽</div>
          <p className="text-xl font-bold text-slate-700 mb-2">אין משחקים זמינים עדיין</p>
          <p className="text-sm text-slate-500">חזרו בקרוב!</p>
        </div>
      )}
    </div>
  )
}
