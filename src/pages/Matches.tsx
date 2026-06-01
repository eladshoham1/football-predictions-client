import React, { useState } from 'react'
import { useMatches, useMyPredictions, useUpsertPrediction } from '../services/hooks'

export default function Matches() {
  const { data: matches, isLoading } = useMatches()
  const { data: predictions } = useMyPredictions()
  const upsertMutation = useUpsertPrediction()
  const [scores, setScores] = useState<Record<string, { home: string; away: string }>>({})

  const getPrediction = (matchId: string) => {
    return predictions?.find((p: any) => p.matchId === matchId)
  }

  const handleScoreChange = (matchId: string, team: 'home' | 'away', value: string) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || { home: '', away: '' }),
        [team]: value,
      },
    }))
  }

  const handleSubmit = (matchId: string) => {
    const score = scores[matchId]
    if (!score || score.home === '' || score.away === '') return

    upsertMutation.mutate({
      matchId,
      homeScore: parseInt(score.home),
      awayScore: parseInt(score.away),
    })
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
      timeZone: 'Asia/Jerusalem'
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jerusalem'
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black gradient-text">ניחושי משחקים</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-2xl animate-pulse" />
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
          {matches?.length || 0} {'משחקים בסה"כ'}
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
                home: prediction?.predictedHomeScore?.toString() || '',
                away: prediction?.predictedAwayScore?.toString() || '',
              }

              return (
                <div key={match.id} className="card hover:shadow-lg transition-all">
                  {/* Time & Status Bar - Mobile Optimized */}
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="text-sm md:text-base font-semibold text-slate-700">
                        {formatTime(match.kickoffTime)}
                      </div>
                      {match.groupName && (
                        <span className="badge badge-info text-xs">
                          {match.groupName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {locked && (
                        <span className="badge badge-danger text-xs">נעול</span>
                      )}
                      {match.status === 'LIVE' && (
                        <span className="badge badge-success text-xs animate-pulse">חי</span>
                      )}
                      {match.status === 'FINISHED' && (
                        <span className="badge badge-info text-xs">סיום</span>
                      )}
                    </div>
                  </div>

                  {/* Match Content - Mobile First */}
                  <div className="flex flex-col gap-4">
                    {/* Teams Row */}
                    <div className="flex items-center justify-between gap-3">
                      {/* Home Team */}
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="font-semibold text-slate-800 text-right text-sm md:text-base truncate">
                          {match.homeTeam.name}
                        </span>
                        {match.homeTeam.flagUrl ? (
                          <img 
                            src={match.homeTeam.flagUrl} 
                            alt={match.homeTeam.name}
                            className="w-8 h-6 md:w-10 md:h-7 object-cover rounded flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="text-2xl md:text-3xl flex-shrink-0">⚽</div>
                        )}
                      </div>

                      {/* Score Display/Input - Mobile Optimized */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {match.status === 'FINISHED' ? (
                          <div className="flex items-center gap-2 text-xl md:text-2xl font-bold">
                            <span className="gradient-text">{match.homeScore}</span>
                            <span className="text-slate-400">-</span>
                            <span className="gradient-text">{match.awayScore}</span>
                          </div>
                        ) : locked ? (
                          <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-slate-500">
                            <span>{currentScore.home || '-'}</span>
                            <span>:</span>
                            <span>{currentScore.away || '-'}</span>
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
                              className="score-input"
                              placeholder="0"
                            />
                            <span className="text-xl md:text-2xl font-bold text-slate-400">:</span>
                            <input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              min="0"
                              max="20"
                              value={currentScore.away}
                              onChange={(e) => handleScoreChange(match.id, 'away', e.target.value)}
                              className="score-input"
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
                            className="w-8 h-6 md:w-10 md:h-7 object-cover rounded flex-shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="text-2xl md:text-3xl flex-shrink-0">⚽</div>
                        )}
                        <span className="font-semibold text-slate-800 text-sm md:text-base truncate">
                          {match.awayTeam.name}
                        </span>
                      </div>
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100">
                      {/* Submit Button or Points */}
                      {!locked && match.status !== 'FINISHED' ? (
                        <button
                          onClick={() => handleSubmit(match.id)}
                          disabled={!currentScore.home || !currentScore.away || upsertMutation.isPending}
                          className="btn-primary w-full"
                        >
                          {prediction ? 'עדכון ניחוש' : 'שליחת ניחוש'}
                        </button>
                      ) : prediction && match.status === 'FINISHED' ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-sm text-slate-600">
                            ניחוש: {prediction.predictedHomeScore} : {prediction.predictedAwayScore}
                          </span>
                          <div className="text-center">
                            <div className="text-2xl md:text-3xl font-black gradient-text">
                              +{prediction.pointsAwarded || 0}
                            </div>
                            <div className="text-xs text-slate-500">נקודות</div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Stage Badge */}
                  {match.stage && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <span className="badge badge-info text-xs">
                        {match.stage.replace(/_/g, ' ')}
                      </span>
                      {match.groupName && (
                        <span className="badge badge-info text-xs ml-2">
                          Group {match.groupName}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {!matches?.length && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">⚽</div>
          <p className="text-lg text-slate-600">אין משחקים זמינים עדיין</p>
          <p className="text-sm text-slate-500 mt-2">חזרו בקרוב!</p>
        </div>
      )}
    </div>
  )
}
