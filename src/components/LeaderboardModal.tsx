import { useState, useEffect } from 'react'
import type { UserScore } from '../lib/types'
import { guessesToEmojiGrid } from '../lib/scoring'
import { supabase } from '../lib/supabase'
import { getTodayEastern, getTodayStartEastern, getEasternWeekBounds } from '../lib/date'
import { Analytics } from '../lib/analytics'

interface LeaderboardModalProps {
  onClose: () => void
  currentNickname?: string
  currentScore?: number
}

interface WeeklyEntry {
  nickname: string
  weeklyScore: number
  daysPlayed: number
  dailyScores: { date: string; score: number; guesses: { score: number }[] }[]
}

export default function LeaderboardModal({ onClose, currentNickname, currentScore }: LeaderboardModalProps) {
  const [tab, setTab] = useState<'daily' | 'weekly'>('daily')
  const [daily, setDaily] = useState<UserScore[]>([])
  const [weekly, setWeekly] = useState<WeeklyEntry[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    Analytics.leaderboardViewed('daily')
    fetchDaily()
    fetchWeekly()
  }, [])

  async function fetchDaily() {
    const today = getTodayEastern()
    const { data } = await supabase
      .from('user_scores')
      .select('*')
      .eq('session_date', today)
      .gte('created_at', getTodayStartEastern())
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
    if (data) setDaily(data)
  }

  async function fetchWeekly() {
    const { start, end } = getEasternWeekBounds()
    const { data } = await supabase
      .from('user_scores')
      .select('*')
      .gte('session_date', start)
      .lte('session_date', end)
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })

    if (!data) return

    // Group by lowercase nickname
    const groups = new Map<string, { nickname: string; days: Map<string, { score: number; guesses: { score: number }[] }> }>()
    for (const row of data) {
      const key = row.nickname.toLowerCase()
      if (!groups.has(key)) {
        groups.set(key, { nickname: row.nickname, days: new Map() })
      }
      const g = groups.get(key)!
      // Use most recent casing
      g.nickname = row.nickname
      if (!g.days.has(row.session_date) || row.total_score > g.days.get(row.session_date)!.score) {
        g.days.set(row.session_date, { score: row.total_score, guesses: row.guesses })
      }
    }

    const entries: WeeklyEntry[] = []
    for (const [, g] of groups) {
      const dailyScores = Array.from(g.days.entries())
        .map(([date, d]) => ({ date, score: d.score, guesses: d.guesses }))
        .sort((a, b) => a.date.localeCompare(b.date))
      entries.push({
        nickname: g.nickname,
        weeklyScore: dailyScores.reduce((s, d) => s + d.score, 0),
        daysPlayed: dailyScores.length,
        dailyScores,
      })
    }

    entries.sort((a, b) => b.weeklyScore - a.weeklyScore)
    setWeekly(entries)
  }

  function isMe(nickname: string, score?: number) {
    if (!currentNickname) return false
    const match = nickname.toLowerCase() === currentNickname.toLowerCase()
    return score !== undefined && currentScore !== undefined ? match && score === currentScore : match
  }

  function formatShortDate(dateStr: string): string {
    const [, m, d] = dateStr.split('-')
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[parseInt(m) - 1]} ${parseInt(d)}`
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        className="bg-[#0d1117] border border-[#30363d] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h2 className="text-white font-bold text-lg">Leaderboard</h2>
          <button onClick={onClose} className="text-[#8b949e] hover:text-white text-xl leading-none">✕</button>
        </div>

        {/* Tabs */}
        <div className="flex px-5 gap-1 shrink-0 mb-3">
          <button
            onClick={() => { setTab('daily'); setExpandedId(null); Analytics.leaderboardViewed('daily') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'daily' ? 'bg-[#e63946] text-white' : 'bg-[#161b22] text-[#8b949e]'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => { setTab('weekly'); setExpandedId(null); Analytics.leaderboardViewed('weekly') }}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
              tab === 'weekly' ? 'bg-[#e63946] text-white' : 'bg-[#161b22] text-[#8b949e]'
            }`}
          >
            Weekly
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-1">
          {tab === 'daily' && (
            daily.length === 0 ? (
              <p className="text-[#484f58] text-sm text-center py-8">No scores yet today — be the first! 🏁</p>
            ) : (
              daily.map((entry, i) => {
                const me = isMe(entry.nickname, entry.total_score)
                const expanded = expandedId === entry.id
                return (
                  <div key={entry.id}>
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${
                        me
                          ? 'bg-[#e63946]/15 border border-[#e63946]/40'
                          : i === 0
                            ? 'bg-[#e63946]/10 border border-[#e63946]/30'
                            : 'bg-[#161b22] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8b949e] font-bold text-sm w-6 text-right">
                          {i === 0 ? '👑' : `#${i + 1}`}
                        </span>
                        <span className={`text-sm ${me ? 'text-white font-bold' : 'text-white font-medium'}`}>
                          {entry.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {me && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e63946]/30 text-[#e63946] px-1.5 py-0.5 rounded">You</span>
                        )}
                        <span className="text-white font-bold text-sm">{entry.total_score}</span>
                      </div>
                    </button>
                    {expanded && entry.guesses?.length > 0 && (
                      <div className="px-4 py-2 text-center">
                        <span className="text-lg tracking-wider">{guessesToEmojiGrid(entry.guesses)}</span>
                      </div>
                    )}
                  </div>
                )
              })
            )
          )}

          {tab === 'weekly' && (
            weekly.length === 0 ? (
              <p className="text-[#484f58] text-sm text-center py-8">No scores this week yet</p>
            ) : (
              weekly.map((entry, i) => {
                const me = isMe(entry.nickname)
                const expanded = expandedId === entry.nickname.toLowerCase()
                return (
                  <div key={entry.nickname.toLowerCase()}>
                    <button
                      onClick={() => setExpandedId(expanded ? null : entry.nickname.toLowerCase())}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${
                        me
                          ? 'bg-[#e63946]/15 border border-[#e63946]/40'
                          : i === 0
                            ? 'bg-[#e63946]/10 border border-[#e63946]/30'
                            : 'bg-[#161b22] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[#8b949e] font-bold text-sm w-6 text-right">
                          {i === 0 ? '👑' : `#${i + 1}`}
                        </span>
                        <span className={`text-sm ${me ? 'text-white font-bold' : 'text-white font-medium'}`}>
                          {entry.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {me && (
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e63946]/30 text-[#e63946] px-1.5 py-0.5 rounded">You</span>
                        )}
                        <span className="text-[#8b949e] text-xs mr-1">{entry.daysPlayed}/7</span>
                        <span className="text-white font-bold text-sm">{entry.weeklyScore}</span>
                      </div>
                    </button>
                    {expanded && (
                      <div className="px-4 py-2 space-y-1">
                        {entry.dailyScores.map((day) => (
                          <div key={day.date} className="flex items-center gap-2">
                            <span className="text-[#484f58] text-xs w-12 shrink-0">{formatShortDate(day.date)}</span>
                            <span className="text-sm tracking-wider">{guessesToEmojiGrid(day.guesses)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )
          )}
        </div>
      </div>
    </div>
  )
}
