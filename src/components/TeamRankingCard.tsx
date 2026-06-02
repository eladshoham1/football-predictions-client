import React, { useState, useEffect } from 'react'
import { getTeamDisplayName } from '../utils/teamUtils'

interface Team {
  id: string
  name: string
  hebrewName?: string | null
  code: string
  flagUrl: string | null
}

interface TeamRankingCardProps {
  groupName: string
  teams: Team[]
  initialRanking?: string[] // Array of team IDs in order [1st, 2nd, 3rd, 4th]
  onRankingChange: (ranking: string[]) => void
  isLocked: boolean
  lockTime?: Date | null
  isPredicted: boolean
}

export default function TeamRankingCard({
  groupName,
  teams,
  initialRanking,
  onRankingChange,
  isLocked,
  lockTime,
  isPredicted
}: TeamRankingCardProps) {
  // Initialize state only once with lazy initialization
  const [ranking, setRanking] = useState<string[]>(() => {
    if (initialRanking && initialRanking.length === 4) {
      return initialRanking
    }
    if (teams && teams.length > 0) {
      return teams.map(t => t.id)
    }
    return []
  })
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Initialize ranking when teams are loaded (only once)
  useEffect(() => {
    if (!isInitialized && teams && teams.length > 0) {
      if (initialRanking && initialRanking.length === 4) {
        setRanking(initialRanking)
      } else {
        setRanking(teams.map(t => t.id))
      }
      setIsInitialized(true)
    }
  }, [teams, initialRanking, isInitialized])

  const handleDragStart = (index: number) => {
    if (isLocked) return
    setDraggedIndex(index)
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (isLocked || draggedIndex === null || draggedIndex === index) return

    const newRanking = [...ranking]
    const draggedItem = newRanking[draggedIndex]
    newRanking.splice(draggedIndex, 1)
    newRanking.splice(index, 0, draggedItem)
    
    setRanking(newRanking)
    setDraggedIndex(index)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    if (ranking.length === 4) {
      onRankingChange(ranking)
    }
  }

  const handleMoveUp = (index: number) => {
    if (isLocked || index === 0) return
    const newRanking = [...ranking]
    ;[newRanking[index], newRanking[index - 1]] = [newRanking[index - 1], newRanking[index]]
    console.log('Moving up:', { index, newRanking })
    setRanking(newRanking)
    onRankingChange(newRanking)
  }

  const handleMoveDown = (index: number) => {
    if (isLocked || index === ranking.length - 1) return
    const newRanking = [...ranking]
    ;[newRanking[index], newRanking[index + 1]] = [newRanking[index + 1], newRanking[index]]
    console.log('Moving down:', { index, newRanking })
    setRanking(newRanking)
    onRankingChange(newRanking)
  }

  const getTeamById = (teamId: string) => teams.find(t => t.id === teamId)

  const getRankBadgeColor = (index: number) => {
    if (index === 0) return 'bg-yellow-400 text-yellow-900'
    if (index === 1) return 'bg-slate-300 text-slate-800'
    if (index === 2) return 'bg-amber-600 text-white'
    return 'bg-slate-500 text-white'
  }

  const getRankEmoji = (index: number) => {
    if (index === 0) return '🥇'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return '4️⃣'
  }

  if (ranking.length !== 4) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-100 rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="card space-y-4">
      {/* Group Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black gradient-text">קבוצה {groupName}</h2>
        <div className="flex gap-2">
          {isPredicted && !isLocked && (
            <span className="badge badge-success text-xs">✓</span>
          )}
          {isLocked && (
            <span className="badge badge-error text-xs">🔒 נעול</span>
          )}
        </div>
      </div>

      {/* Ranking List */}
      <div className="space-y-2">
        {ranking.map((teamId, index) => {
          const team = getTeamById(teamId)
          if (!team) return null

          return (
            <div
              key={teamId}
              draggable={!isLocked}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`group relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                isLocked 
                  ? 'border-slate-200 bg-slate-50 opacity-75' 
                  : 'border-slate-300 bg-white hover:border-primary-400 hover:shadow-md cursor-move'
              } ${draggedIndex === index ? 'opacity-50 scale-95' : ''}`}
            >
              {/* Rank Badge */}
              <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getRankBadgeColor(index)} flex items-center justify-center font-black text-lg shadow-md`}>
                {getRankEmoji(index)}
              </div>

              {/* Flag */}
              {team.flagUrl ? (
                <img 
                  src={team.flagUrl} 
                  alt={team.name}
                  className="w-10 h-7 object-cover rounded shadow-sm flex-shrink-0"
                />
              ) : (
                <span className="text-2xl">⚽</span>
              )}

              {/* Team Name */}
              <div className="flex-1 min-w-0">
                <div className="font-bold text-slate-800 truncate">{getTeamDisplayName(team)}</div>
                <div className="text-xs text-slate-500">{team.code}</div>
              </div>

              {/* Move Buttons (Desktop & Mobile) */}
              {!isLocked && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className={`p-1 rounded transition-all ${
                      index === 0 
                        ? 'text-slate-300 cursor-not-allowed' 
                        : 'text-primary-600 hover:bg-primary-50 active:scale-95'
                    }`}
                    title="העלה"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMoveDown(index)}
                    disabled={index === ranking.length - 1}
                    className={`p-1 rounded transition-all ${
                      index === ranking.length - 1
                        ? 'text-slate-300 cursor-not-allowed' 
                        : 'text-primary-600 hover:bg-primary-50 active:scale-95'
                    }`}
                    title="הורד"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Drag Handle (Desktop) */}
              {!isLocked && (
                <div className="hidden md:flex flex-col gap-0.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                  <div className="w-1 h-1 rounded-full bg-current"></div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Instructions */}
      {!isLocked && (
        <div className="text-xs text-slate-500 text-center">
          <span className="hidden md:inline">גרור ושחרר או השתמש בחיצים לסידור מחדש</span>
          <span className="md:hidden">השתמש בחיצים לסידור מחדש</span>
        </div>
      )}
    </div>
  )
}
