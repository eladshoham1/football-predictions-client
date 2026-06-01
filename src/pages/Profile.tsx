import React from 'react'
import { useAuth } from '../AuthContext'
import { useQuery } from '@tanstack/react-query'
import { getMyMatchPredictions, getMyGroupPredictions, getMyTournamentPrediction, fetchLeaderboard } from '../api'

export default function Profile() {
  const { user } = useAuth()
  
  const { data: matchPredictions } = useQuery({
    queryKey: ['myMatchPredictions'],
    queryFn: getMyMatchPredictions,
  })

  const { data: groupPredictions } = useQuery({
    queryKey: ['myGroupPredictions'],
    queryFn: getMyGroupPredictions,
  })

  const { data: tournamentPrediction } = useQuery({
    queryKey: ['myTournamentPrediction'],
    queryFn: getMyTournamentPrediction,
  })

  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: fetchLeaderboard,
  })

  if (!user) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">👤</div>
        <p className="text-lg text-slate-600">אנא התחברו לצפייה בפרופיל</p>
      </div>
    )
  }

  const myRank = leaderboard?.find((l: any) => l.userId === user.id)
  const totalPoints = matchPredictions?.reduce((sum: number, p: any) => sum + (p.pointsAwarded || 0), 0) || 0
  const correctPredictions = matchPredictions?.filter((p: any) => (p.pointsAwarded || 0) > 0).length || 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Profile Header */}
      <div className="card bg-gradient-to-r from-primary-50 to-accent-50">
        <div className="flex items-center gap-6">
          {user.avatarUrl && (
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-24 h-24 rounded-full ring-4 ring-white shadow-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-3xl font-black gradient-text">{user.name}</h1>
            <p className="text-slate-600 mt-1">{user.email}</p>
            {user.role === 'ADMIN' && (
              <span className="badge badge-warning mt-2">מנהל</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon="🏆"
          label="דירוג"
          value={myRank?.rank ? `#${myRank.rank}` : '-'}
          gradient
        />
        <StatCard
          icon="📊"
          label={'סה"כ נקודות'}
          value={totalPoints.toString()}
        />
        <StatCard
          icon="✅"
          label="ניחושים נכונים"
          value={correctPredictions.toString()}
        />
        <StatCard
          icon="⚽"
          label={'סה"ך ניחושים'}
          value={matchPredictions?.length?.toString() || '0'}
        />
      </div>

      {/* Predictions Summary */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Match Predictions */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>⚽</span>
            ניחושי משחקים
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{'סה"כ משחקים:'}</span>
              <span className="font-semibold">{matchPredictions?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">צברו נקודות:</span>
              <span className="font-semibold">{correctPredictions}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">תוצאות מדויקות:</span>
              <span className="font-semibold">
                {matchPredictions?.filter((p: any) => (p.pointsAwarded || 0) >= 5).length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Group Predictions */}
        <div className="card">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>👥</span>
            ניחושי קבוצות
          </h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">קבוצות שנוחשו:</span>
              <span className="font-semibold">{groupPredictions?.length || 0} / 12</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">{'סה"כ נקודות:'}</span>
              <span className="font-semibold">
                {groupPredictions?.reduce((sum: number, p: any) => sum + (p.pointsAwarded || 0), 0) || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="card">
        <h2 className="text-xl font-bold text-slate-800 mb-4">ניחושי משחקים אחרונים</h2>
        <div className="space-y-3">
          {matchPredictions?.slice(0, 5).map((pred: any) => (
            <div key={pred.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-4">
                <div className="font-semibold text-slate-800">
                  {pred.match?.homeTeam?.name} נגד {pred.match?.awayTeam?.name}
                </div>
                <div className="text-sm text-slate-600">
                  נוחש: {pred.predictedHomeScore} - {pred.predictedAwayScore}
                </div>
              </div>
              {pred.pointsAwarded !== undefined && (
                <div className="font-bold gradient-text">+{pred.pointsAwarded}</div>
              )}
            </div>
          ))}

          {!matchPredictions?.length && (
            <div className="text-center py-8 text-slate-500">
              <p>אין ניחושים עדיין</p>
              <a href="#matches" className="text-primary-600 hover:text-primary-700 text-sm font-medium mt-2 inline-block">
                בצעו את הניחוש הראשון ←
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tournament Prediction */}
      {tournamentPrediction && (
        <div className="card bg-gradient-to-r from-yellow-50 to-amber-50">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
            <span>🏆</span>
            ניחוש מנצח הטורניר
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600 mb-2">הבחירה שלך:</p>
              <p className="text-lg font-bold text-slate-800">
                {tournamentPrediction.winnerTeam?.name || 'לא נבחר'}
              </p>
            </div>
            {tournamentPrediction.winnerPointsAwarded > 0 && (
              <div className="text-right">
                <div className="text-3xl font-black gradient-text">
                  +{tournamentPrediction.winnerPointsAwarded}
                </div>
                <div className="text-xs text-slate-500">נקודות</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, gradient }: { icon: string; label: string; value: string; gradient?: boolean }) {
  return (
    <div className={`stat-card text-center ${gradient ? 'bg-gradient-to-br from-primary-50 to-accent-50' : ''}`}>
      <div className="text-4xl mb-2">{icon}</div>
      <div className={`text-3xl font-black mb-1 ${gradient ? 'gradient-text' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  )
}
