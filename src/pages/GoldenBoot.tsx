import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPlayers, fetchTeams, upsertTournamentPrediction, getMyTournamentPrediction } from '../api'

interface Player {
  id: string
  name: string
  position: string | null
  team: {
    id: string
    name: string
    code: string
    flagUrl: string | null
  }
}

export default function GoldenBoot() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>('ALL')
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const { data: players, isLoading: playersLoading } = useQuery({
    queryKey: ['players'],
    queryFn: fetchPlayers,
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: fetchTeams,
  })

  const { data: myPrediction } = useQuery({
    queryKey: ['tournamentPrediction'],
    queryFn: getMyTournamentPrediction,
  })

  const upsertMutation = useMutation({
    mutationFn: (data: { goldenBootPlayerId: string; winnerTeamId: string }) => 
      upsertTournamentPrediction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tournamentPrediction'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
      alert('✅ הניחוש נשמר בהצלחה!')
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || 'שגיאה בשמירת הניחוש')
    }
  })

  // Filter players by search query and team
  const filteredPlayers = players?.filter((player: Player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.team.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTeam = selectedTeamFilter === 'ALL' || player.team.code === selectedTeamFilter
    return matchesSearch && matchesTeam
  }) || []

  // Group players by team
  const playersByTeam = filteredPlayers.reduce((acc: Record<string, Player[]>, player: Player) => {
    const teamName = player.team.name
    if (!acc[teamName]) acc[teamName] = []
    acc[teamName].push(player)
    return acc
  }, {})

  const handleSelectPlayer = (player: Player) => {
    setSelectedPlayer(player)
  }

  const handleSave = () => {
    if (!selectedPlayer) {
      alert('אנא בחרו שחקן')
      return
    }

    // If user already has a tournament prediction with winner, use it. Otherwise, user must select winner first.
    if (!myPrediction?.winnerTeamId) {
      alert('תחילה בחרו את הקבוצה המנצחת בעמוד הפלייאוף')
      return
    }

    upsertMutation.mutate({
      goldenBootPlayerId: selectedPlayer.id,
      winnerTeamId: myPrediction.winnerTeamId
    })
  }

  // Set initial selected player from existing prediction
  React.useEffect(() => {
    if (myPrediction?.goldenBootPlayer && !selectedPlayer) {
      setSelectedPlayer(myPrediction.goldenBootPlayer)
    }
  }, [myPrediction])

  if (playersLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black gradient-text">מלך השערים</h1>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!players || players.length === 0) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-3xl font-black gradient-text">מלך השערים</h1>
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">⚽</div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">אין שחקנים זמינים</h3>
          <p className="text-slate-600">השחקנים יתווספו בקרוב</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black gradient-text">מלך השערים ⚽👑</h1>
        <p className="text-slate-600 mt-2">נחשו מי יהיה מלך השערים של המונדיאל</p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl">👑</div>
          <div className="text-sm text-yellow-900">
            <strong>מלך השערים:</strong> השחקן שיכבוש הכי הרבה שערים במהלך הטורניר. ניחוש נכון מזכה ב-25 נקודות!
          </div>
        </div>
      </div>

      {/* Current Selection */}
      {selectedPlayer && (
        <div className="card bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">👑</div>
              <div>
                <div className="text-sm text-green-700 font-medium">הבחירה שלך למלך השערים</div>
                <div className="flex items-center gap-3 mt-2">
                  {selectedPlayer.team.flagUrl && (
                    <img 
                      src={selectedPlayer.team.flagUrl} 
                      alt={selectedPlayer.team.name}
                      className="w-10 h-7 object-cover rounded shadow-sm"
                    />
                  )}
                  <div>
                    <div className="font-bold text-slate-800 text-lg">{selectedPlayer.name}</div>
                    <div className="text-sm text-slate-600">{selectedPlayer.team.name} • {selectedPlayer.position}</div>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleSave}
              disabled={upsertMutation.isPending}
              className="btn-primary"
            >
              {upsertMutation.isPending ? 'שומר...' : '💾 שמור ניחוש'}
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="חיפוש שחקן או קבוצה..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary-500 focus:outline-none"
            />
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeamFilter}
            onChange={(e) => setSelectedTeamFilter(e.target.value)}
            className="px-4 py-3 rounded-lg border-2 border-slate-200 focus:border-primary-500 focus:outline-none"
          >
            <option value="ALL">כל הקבוצות</option>
            {teams?.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((team: any) => (
              <option key={team.id} value={team.code}>{team.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Players List */}
      <div className="space-y-6">
        {Object.keys(playersByTeam).sort().map((teamName) => (
          <div key={teamName} className="card">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              {playersByTeam[teamName][0].team.flagUrl && (
                <img 
                  src={playersByTeam[teamName][0].team.flagUrl} 
                  alt={teamName}
                  className="w-8 h-6 object-cover rounded shadow-sm"
                />
              )}
              {teamName}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {playersByTeam[teamName].map((player: Player) => (
                <button
                  key={player.id}
                  onClick={() => handleSelectPlayer(player)}
                  className={`p-4 rounded-xl border-2 transition-all text-right ${
                    selectedPlayer?.id === player.id
                      ? 'bg-primary-100 border-primary-500 shadow-md scale-105'
                      : 'bg-white border-slate-200 hover:border-primary-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-800">{player.name}</div>
                      <div className="text-sm text-slate-500">{player.position || 'שחקן'}</div>
                    </div>
                    {selectedPlayer?.id === player.id && (
                      <div className="text-green-600 font-bold text-2xl">✓</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-slate-600">לא נמצאו שחקנים התואמים לחיפוש</p>
        </div>
      )}

      {/* Summary */}
      {!selectedPlayer && (
        <div className="card bg-blue-50 border-2 border-blue-200 text-center">
          <div className="text-4xl mb-3">👆</div>
          <p className="text-blue-800">בחרו שחקן שלדעתכם יהיה מלך השערים של המונדיאל</p>
        </div>
      )}
    </div>
  )
}
