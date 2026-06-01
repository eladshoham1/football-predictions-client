import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchTeams, upsertGroupPredictions, getMyGroupPredictions, getGroupLockStatus } from '../api'
import TeamRankingCard from '../components/TeamRankingCard'

const GROUPS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']

export default function GroupStage() {
  const queryClient = useQueryClient()
  
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  const { data: myPredictions } = useQuery({
    queryKey: ['groupPredictions'],
    queryFn: getMyGroupPredictions,
  })

  const { data: lockStatus } = useQuery({
    queryKey: ['groupLockStatus'],
    queryFn: getGroupLockStatus,
    refetchInterval: 60000, // Refresh every minute
  })

  const upsertMutation = useMutation({
    mutationFn: upsertGroupPredictions,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groupPredictions'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      setPendingRankings({}) // Clear pending changes after successful save
      alert('✅ כל הניחושים נשמרו בהצלחה!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בשמירת הניחושים')
    }
  })

  const [pendingRankings, setPendingRankings] = useState<Record<string, string[]>>({})

  const getGroupTeams = (groupName: string) => {
    return teams?.filter((t: any) => t.groupName === groupName) || []
  }

  const getPrediction = (groupName: string) => {
    return myPredictions?.find((p: any) => p.groupName === groupName)
  }

  const getGroupLock = (groupName: string) => {
    return lockStatus?.find((s: any) => s.groupName === groupName)
  }

  const handleRankingChange = (groupName: string, ranking: string[]) => {
    console.log('Ranking changed for group:', groupName, ranking)
    setPendingRankings(prev => ({ ...prev, [groupName]: ranking }))
  }

  // Get current ranking for a group (from pendingRankings or from initial teams)
  const getCurrentRanking = (groupName: string): string[] | null => {
    const groupTeams = getGroupTeams(groupName)
    const prediction = getPrediction(groupName)
    const ranking = pendingRankings[groupName]
    
    // If user made changes, use those
    if (ranking && ranking.length === 4) {
      return ranking
    }
    
    // If there's an existing prediction, use that
    if (prediction) {
      const predRanking = [
        prediction.firstPlaceTeamId,
        prediction.secondPlaceTeamId,
        prediction.thirdPlaceTeamId,
        prediction.fourthPlaceTeamId
      ].filter(Boolean)
      if (predRanking.length === 4) {
        return predRanking
      }
    }
    
    // Use default team order if all 4 teams are loaded
    if (groupTeams.length === 4) {
      return groupTeams.map((t: any) => t.id)
    }
    
    return null
  }

  const handleSubmitAll = () => {
    // Get all groups with valid rankings
    const predictions = GROUPS.map(groupName => {
      const lockInfo = getGroupLock(groupName)
      
      // Skip locked groups
      if (lockInfo?.isLocked) {
        return null
      }
      
      const finalRanking = getCurrentRanking(groupName)
      
      if (!finalRanking || finalRanking.length !== 4) {
        return null
      }
      
      return {
        groupName,
        firstPlaceTeamId: finalRanking[0],
        secondPlaceTeamId: finalRanking[1],
        thirdPlaceTeamId: finalRanking[2],
        fourthPlaceTeamId: finalRanking[3]
      }
    }).filter(Boolean) as Array<{
      groupName: string
      firstPlaceTeamId: string
      secondPlaceTeamId: string
      thirdPlaceTeamId: string
      fourthPlaceTeamId: string
    }>
    
    if (predictions.length === 0) {
      alert('אנא המתינו לטעינת הקבוצות')
      return
    }
    
    upsertMutation.mutate(predictions)
  }

  // Count how many groups have valid rankings ready to save
  const groupsWithRankings = GROUPS.filter(g => {
    const lockInfo = getGroupLock(g)
    if (lockInfo?.isLocked) return false
    return getCurrentRanking(g) !== null
  }).length

  const hasAnyPendingChanges = Object.keys(pendingRankings).length > 0
  const totalPredictedGroups = GROUPS.filter(g => getPrediction(g)).length
  const unlockedGroups = GROUPS.filter(g => !getGroupLock(g)?.isLocked).length
  const canSave = groupsWithRankings > 0 && !teamsLoading

  if (teamsLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black gradient-text">ניחושי שלב הקבוצות</h1>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-96 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Global Lock Warning */}
      {lockStatus && lockStatus.length > 0 && (
        <>
          {lockStatus[0].isLocked ? (
            <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 text-center">
              <div className="text-2xl mb-2">🔒</div>
              <div className="text-lg font-bold text-red-800">ניחושי שלב הקבוצות נעולים</div>
              <div className="text-sm text-red-700 mt-1">הטורניר החל והניחושים אינם ניתנים לעריכה</div>
            </div>
          ) : lockStatus[0].lockTime && (
            <div className="bg-gradient-to-r from-blue-50 to-primary-50 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">⏰</div>
                  <div>
                    <div className="font-bold text-blue-900 text-lg">כל ניחושי שלב הקבוצות ינעלו ב:</div>
                    <div className="text-blue-700 font-semibold mt-0.5">
                      {new Date(lockStatus[0].lockTime).toLocaleString('he-IL', {
                        timeZone: 'Asia/Jerusalem',
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
                <div className="badge badge-warning text-sm px-4 py-2">30 דק' לפני תחילת הטורניר</div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Header with Save Button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black gradient-text">ניחושי שלב הקבוצות</h1>
          <p className="text-slate-600 mt-2">דרגו את הקבוצות בכל קבוצה (1-4)</p>
          <div className="flex items-center gap-3 mt-2 text-sm">
            <span className="text-slate-500">
              {'סה"כ קבוצות מוכנות:'} <strong className="text-primary-600">{groupsWithRankings}/{unlockedGroups}</strong>
            </span>
            {hasAnyPendingChanges && (
              <span className="badge badge-warning text-xs">שינויים לא שמורים</span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <div className="badge badge-info">דרגו 4 קבוצות</div>
            <div className="badge badge-warning">נעילה כללית 30 דק' לפני תחילת הטורניר</div>
          </div>
          {canSave && (
            <button
              onClick={handleSubmitAll}
              disabled={upsertMutation.isPending}
              className="btn-primary w-full md:w-auto px-8"
            >
              {upsertMutation.isPending ? 'שומר...' : `💾 שמור ${groupsWithRankings} קבוצות`}
            </button>
          )}
        </div>
      </div>

      {/* Info Box */}
      {!hasAnyPendingChanges && canSave && totalPredictedGroups === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          <strong>💡 טיפ:</strong> הסדר הנוכחי של הקבוצות יישמר כניחוש שלכם. אם אתם מסכימים עם הסדר, פשוט לחצו על "שמור".
          <div className="mt-2 text-xs">
            <strong>🔒 חשוב:</strong> כל הניחושים של שלב הקבוצות ינעלו יחד, 30 דקות לפני תחילת המשחק הראשון של הטורניר.
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {GROUPS.map((groupName) => {
          const groupTeams = getGroupTeams(groupName)
          const prediction = getPrediction(groupName)
          const lockInfo = getGroupLock(groupName)
          
          // Build initial ranking from prediction or default order
          let initialRanking: string[] | undefined
          if (prediction) {
            initialRanking = [
              prediction.firstPlaceTeamId,
              prediction.secondPlaceTeamId,
              prediction.thirdPlaceTeamId || '',
              prediction.fourthPlaceTeamId || ''
            ].filter(Boolean)
            
            // If prediction doesn't have all 4, fill with remaining teams
            if (initialRanking.length < 4) {
              const usedIds = new Set(initialRanking)
              const remaining = groupTeams
                .filter((t: any) => !usedIds.has(t.id))
                .map((t: any) => t.id)
              initialRanking = [...initialRanking, ...remaining].slice(0, 4)
            }
          } else if (groupTeams.length === 4) {
            // Use default team order for new predictions
            initialRanking = groupTeams.map((t: any) => t.id)
          }

          return (
            <TeamRankingCard
              key={groupName}
              groupName={groupName}
              teams={groupTeams}
              initialRanking={initialRanking}
              onRankingChange={(ranking) => handleRankingChange(groupName, ranking)}
              isLocked={lockInfo?.isLocked || false}
              lockTime={lockInfo?.lockTime}
              isPredicted={Boolean(prediction)}
            />
          )
        })}
      </div>

      {/* Third Place Team Selector */}
      {totalPredictedGroups >= 12 && (
        <ThirdPlaceSelector
          groupPredictions={myPredictions || []}
          teams={teams || []}
        />
      )}

      {/* Bottom Save Button */}
      {canSave && (
        <div className="sticky bottom-4 left-0 right-0 flex justify-center z-10">
          <button
            onClick={handleSubmitAll}
            disabled={upsertMutation.isPending}
            className="btn-primary px-12 py-4 text-lg shadow-2xl"
          >
            {upsertMutation.isPending ? 'שומר...' : `💾 שמור ${groupsWithRankings} קבוצות`}
          </button>
        </div>
      )}
    </div>
  )
}

// Third Place Team Selector Component
function ThirdPlaceSelector({ groupPredictions, teams }: any) {
  const [selectedTeams, setSelectedTeams] = useState<Set<string>>(new Set())

  // Get all third place teams
  const thirdPlaceTeams = groupPredictions
    .map((pred: any) => {
      const teamId = pred.thirdPlaceTeamId
      const team = teams.find((t: any) => t.id === teamId)
      return team ? { ...team, groupName: pred.groupName } : null
    })
    .filter(Boolean)
    .sort((a: any, b: any) => a.groupName.localeCompare(b.groupName))

  const toggleTeam = (teamId: string) => {
    setSelectedTeams(prev => {
      const newSet = new Set(prev)
      if (newSet.has(teamId)) {
        newSet.delete(teamId)
      } else if (newSet.size < 8) {
        newSet.add(teamId)
      }
      return newSet
    })
  }

  const selectedCount = selectedTeams.size

  return (
    <div className="card bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300">
      <div className="mb-4">
        <h2 className="text-2xl font-black gradient-text mb-2">🎯 בחירת קבוצות מקום 3</h2>
        <p className="text-slate-600">
          בחרו 8 קבוצות מתוך 12 שסיימו במקום השלישי שיעלו לשלב ה-32
        </p>
        <div className="mt-3 flex items-center gap-3">
          <span className={`px-4 py-2 rounded-lg font-bold ${
            selectedCount === 8 
              ? 'bg-green-100 text-green-800 border-2 border-green-400' 
              : 'bg-slate-100 text-slate-600'
          }`}>
            {selectedCount}/8 קבוצות נבחרו
          </span>
          {selectedCount === 8 && (
            <span className="text-green-600 font-bold">✓ מוכן להמשך!</span>
          )}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {thirdPlaceTeams.map((team: any) => {
          const isSelected = selectedTeams.has(team.id)
          const canSelect = isSelected || selectedTeams.size < 8

          return (
            <button
              key={team.id}
              onClick={() => canSelect && toggleTeam(team.id)}
              disabled={!canSelect}
              className={`p-3 rounded-xl border-2 transition-all text-right ${
                isSelected
                  ? 'bg-primary-100 border-primary-500 shadow-md scale-105'
                  : canSelect
                  ? 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm'
                  : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0">
                  {team.flagUrl ? (
                    <img 
                      src={team.flagUrl} 
                      alt={team.name}
                      className="w-10 h-7 object-cover rounded shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-7 bg-slate-200 rounded" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-800 text-sm truncate">{team.name}</div>
                  <div className="text-xs text-slate-500">קבוצה {team.groupName}</div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0 text-green-600 font-bold text-xl">✓</div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {thirdPlaceTeams.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <div className="text-4xl mb-2">👀</div>
          <p>סיימו את דירוג כל 12 הקבוצות כדי לבחור את קבוצות מקום 3</p>
        </div>
      )}

      {selectedCount < 8 && thirdPlaceTeams.length === 12 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          <strong>💡 טיפ:</strong> לפי חוקי המונדיאל 2026, 8 הקבוצות הטובות שסיימו במקום השלישי ממשיכות לשלב ה-32. 
          בחרו את 8 הקבוצות שלדעתכם יהיו הטובות ביותר מבין קבוצות מקום 3.
        </div>
      )}
    </div>
  )
}
