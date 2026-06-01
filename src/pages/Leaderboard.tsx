import React from 'react'
import { useLeaderboard } from '../services/hooks'

interface LeaderboardProps {
  limit?: number
}

export default function Leaderboard({ limit }: LeaderboardProps = {}) {
  const { data: leaders, isLoading } = useLeaderboard()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {!limit && <h1 className="text-3xl font-black gradient-text">לוח מובילים</h1>}
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const displayLeaders = limit ? leaders?.slice(0, limit) : leaders

  return (
    <div className="space-y-6 animate-fade-in">
      {!limit && <h1 className="text-3xl font-black gradient-text">לוח מובילים</h1>}
      <div className="space-y-3">
      {displayLeaders?.map((leader, idx) => (
        <div
          key={leader.userId}
          className={`card-flat flex items-center gap-4 hover:shadow-md transition-all ${
            idx < 3 ? 'ring-2 ring-primary-200 bg-gradient-to-r from-primary-50/50 to-white' : ''
          }`}
        >
          {/* Rank */}
          <div className="flex-shrink-0">
            {idx === 0 && <div className="text-4xl">🥇</div>}
            {idx === 1 && <div className="text-4xl">🥈</div>}
            {idx === 2 && <div className="text-4xl">🥉</div>}
            {idx > 2 && (
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                <span className="text-lg font-bold text-slate-600">{leader.rank}</span>
              </div>
            )}
          </div>

          {/* Avatar & Name */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {leader.avatarUrl && (
              <img
                src={leader.avatarUrl}
                alt={leader.name}
                className="w-10 h-10 rounded-full ring-2 ring-white shadow-sm"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 truncate">{leader.name}</h3>
              <p className="text-xs text-slate-500">
                {leader.exactCount} מדויקים • {leader.scoringCount} נכונים
              </p>
            </div>
          </div>

          {/* Points */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-black gradient-text">{leader.points}</div>
            <div className="text-xs text-slate-500">נקודות</div>
          </div>
        </div>
      ))}

      {!displayLeaders?.length && (
        <div className="text-center py-12 text-slate-500">
          <div className="text-5xl mb-4">🏆</div>
          <p>אין ניחושים עדיין. היו הראשונים!</p>
        </div>
      )}
      </div>
    </div>
  )
}
