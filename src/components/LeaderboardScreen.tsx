import { useState, useEffect } from 'react'
import type { UserScore } from '../lib/types'
import { supabase } from '../lib/supabase'
import { themeWithEmoji } from '../lib/themes'

interface LeaderboardScreenProps {
  sessionDate: string
  themeName: string
  onBack: () => void
}

export default function LeaderboardScreen({ sessionDate, themeName, onBack }: LeaderboardScreenProps) {
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([])

  useEffect(() => {
    supabase
      .from('user_scores')
      .select('*')
      .eq('session_date', sessionDate)
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setLeaderboard(data)
      })
  }, [sessionDate])

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center px-4 py-10">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1">BERNIE</h1>
        <p className="text-[#e63946] font-semibold text-sm tracking-widest uppercase">Daily</p>
      </div>

      <p className="text-[#8b949e] text-xs uppercase tracking-widest mb-1">{themeWithEmoji(themeName)}</p>
      <p className="text-[#484f58] text-xs mb-6">{sessionDate}</p>

      <div className="w-full max-w-lg">
        <h3 className="text-[#8b949e] text-xs uppercase tracking-widest mb-3 text-center">
          Today's Leaderboard
        </h3>
        {leaderboard.length === 0 ? (
          <p className="text-[#484f58] text-sm text-center">No scores yet</p>
        ) : (
          <div className="space-y-1">
            {leaderboard.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                  i === 0
                    ? 'bg-[#e63946]/10 border border-[#e63946]/30'
                    : i < 3
                      ? 'bg-[#161b22] border border-[#30363d]'
                      : 'bg-[#161b22]/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[#8b949e] font-bold text-sm w-6 text-right">
                    {i === 0 ? '👑' : `#${i + 1}`}
                  </span>
                  <span className="text-white font-medium text-sm">{entry.nickname}</span>
                </div>
                <span className="text-white font-bold text-sm">{entry.total_score}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={onBack}
        className="mt-8 text-[#8b949e] text-sm hover:text-white transition-colors"
      >
        ← Back
      </button>
    </div>
  )
}
