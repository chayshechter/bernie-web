import { useState, useEffect, useRef } from 'react'
import type { Car, GuessResult, UserScore } from '../lib/types'
import { formatPrice, getScoreEmoji, generateShareText, guessesToEmojiGrid } from '../lib/scoring'
import { supabase } from '../lib/supabase'
import { DEV_MODE } from '../lib/devmode'
import { getYesterdayIsrael, getIsraelWeekBounds, getTomorrowIsrael, getTodayStartIsrael } from '../lib/date'
import LeaderboardModal from './LeaderboardModal'
import ComeBackTomorrow from './ComeBackTomorrow'
import { Analytics } from '../lib/analytics'

interface ResultsScreenProps {
  results: GuessResult[]
  cars: Car[]
  nickname: string
  themeName: string
  sessionDate: string
  totalScore: number
}

export default function ResultsScreen({
  results,
  cars,
  nickname: initialNickname,
  themeName,
  sessionDate,
  totalScore,
}: ResultsScreenProps) {
  const [submitState, setSubmitState] = useState<'saving' | 'saved' | 'conflict' | 'error'>('saving')
  const [fallbackNickname, setFallbackNickname] = useState('')
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([])
  const [shared, setShared] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [lbTab, setLbTab] = useState<'daily' | 'weekly'>('daily')
  const [weeklyLb, setWeeklyLb] = useState<{ nickname: string; weeklyScore: number; daysPlayed: number }[]>([])
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const didSubmit = useRef(false)

  useEffect(() => {
    if (!didSubmit.current) {
      didSubmit.current = true
      Analytics.gameCompleted(totalScore, themeName)
      submitScore(initialNickname)
    }
  }, [])

  useEffect(() => {
    fetchLeaderboard()
    fetchWeekly()
  }, [submitState])

  async function fetchLeaderboard() {
    const { data } = await supabase
      .from('user_scores')
      .select('*')
      .eq('session_date', sessionDate)
      .gte('created_at', getTodayStartIsrael())
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
      .limit(50)
    if (data) setLeaderboard(data)
  }

  async function fetchWeekly() {
    const { start, end } = getIsraelWeekBounds()
    const { data } = await supabase
      .from('user_scores')
      .select('*')
      .gte('session_date', start)
      .lte('session_date', end)
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
    if (!data) return
    const groups = new Map<string, { nickname: string; total: number; days: Set<string> }>()
    for (const row of data) {
      const key = row.nickname.toLowerCase()
      if (!groups.has(key)) groups.set(key, { nickname: row.nickname, total: 0, days: new Set() })
      const g = groups.get(key)!
      g.nickname = row.nickname
      if (!g.days.has(row.session_date)) {
        g.total += row.total_score
        g.days.add(row.session_date)
      }
    }
    const entries = Array.from(groups.values())
      .map((g) => ({ nickname: g.nickname, weeklyScore: g.total, daysPlayed: g.days.size }))
      .sort((a, b) => b.weeklyScore - a.weeklyScore)
    setWeeklyLb(entries)
  }

  async function submitScore(name: string) {
    setSubmitting(true)

    const { error } = await supabase.from('user_scores').insert({
      session_date: sessionDate,
      nickname: name.trim(),
      guesses: results,
      total_score: totalScore,
    })

    setSubmitting(false)

    if (error) {
      if (error.code === '23505') {
        setSubmitState('conflict')
        return
      }
      setSubmitState('error')
      return
    }

    // Fire-and-forget: save individual guesses to the guesses table
    supabase
      .from('guesses')
      .insert(
        results.map((r) => ({
          player_name: name.trim(),
          car_id: r.car_id,
          guessed_price: r.guess,
          actual_price: r.actual,
          score: r.score,
        }))
      )
      .then(({ error: guessErr }) => {
        if (guessErr) {
          console.error('[bernie] Failed to save guesses:', guessErr.message)
        } else {
          console.log(`[bernie] Saved ${results.length} guesses for "${name.trim()}"`)
        }
      })

    if (!DEV_MODE) {
      const lastPlayed = localStorage.getItem('bernie_last_played')
      const currentStreak = parseInt(localStorage.getItem('bernie_streak') || '0')
      const yesterdayStr = getYesterdayIsrael()

      const newStreak = lastPlayed === yesterdayStr ? currentStreak + 1 : 1
      try {
        localStorage.setItem('bernie_streak', String(newStreak))
        localStorage.setItem('bernie_last_played', sessionDate)
        localStorage.setItem('bernie_played', JSON.stringify({
          date: sessionDate,
          nickname: name.trim(),
          score: totalScore,
        }))
      } catch {}
    }

    setSubmitState('saved')
  }

  async function handleRetrySubmit() {
    if (!fallbackNickname.trim()) return
    try { localStorage.setItem('bernie_nickname', fallbackNickname.trim()) } catch {}
    await submitScore(fallbackNickname.trim())
  }

  async function handleShare() {
    Analytics.scoreShared()
    const text = generateShareText(
      themeName,
      sessionDate,
      results.map((r) => r.score),
      totalScore
    )

    // Try native share API first (mobile)
    if (navigator.share) {
      try {
        await navigator.share({ text })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    // Fallback: clipboard
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Last resort: select + copy
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }

  const carMap = new Map(cars.map((c) => [c.id, c]))

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center px-4 py-10">
      {/* Score hero */}
      <div className="text-center mb-6">
        <p className="text-[#8b949e] text-xs uppercase tracking-widest mb-2">Your Score</p>
        <p className="text-7xl sm:text-8xl font-black text-white">{totalScore}</p>
        <p className="text-[#8b949e] text-lg mt-1">/ 1000</p>
        <div className="flex justify-center gap-1 mt-4">
          {results.map((r, i) => (
            <span key={i} className="text-2xl">{getScoreEmoji(r.score)}</span>
          ))}
        </div>
      </div>

      {/* Save status */}
      <div className="mb-4 text-center">
        {submitState === 'saving' && (
          <p className="text-[#8b949e] text-sm">Saving your score...</p>
        )}
        {submitState === 'saved' && (
          <p className="text-[#22c55e] text-sm font-medium">Score saved!</p>
        )}
        {submitState === 'error' && (
          <p className="text-[#e63946] text-sm">Failed to save score.</p>
        )}
        {submitState === 'conflict' && (
          <div className="w-full max-w-sm">
            <p className="text-[#e63946] text-sm mb-3">
              "{initialNickname}" already played today. Pick a different name:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fallbackNickname}
                onChange={(e) => setFallbackNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRetrySubmit()}
                placeholder="New nickname"
                maxLength={20}
                className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white placeholder-[#484f58] outline-none focus:border-[#e63946] transition-colors"
              />
              <button
                onClick={handleRetrySubmit}
                disabled={!fallbackNickname.trim() || submitting}
                className="bg-[#e63946] hover:bg-[#d62839] disabled:opacity-40 text-white font-bold px-6 py-3 rounded-xl transition-all"
              >
                {submitting ? '...' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Share button — primary CTA, above everything else */}
      <div className="w-full max-w-lg mb-8">
        <button
          onClick={handleShare}
          className="w-full bg-[#e63946] hover:bg-[#d62839] active:scale-[0.98] text-white font-bold text-lg py-4 rounded-xl transition-all shadow-[0_0_30px_rgba(230,57,70,0.3)]"
        >
          {shared ? '✓ Copied!' : '🏎️ Share My Score'}
        </button>
      </div>

      {/* Streak + Tomorrow */}
      <ComeBackTomorrow tomorrowDate={getTomorrowIsrael()} />

      {/* Breakdown */}
      <div className="w-full max-w-lg space-y-2 mb-8 mt-8">
        <h3 className="text-[#8b949e] text-xs uppercase tracking-widest mb-3 text-center">
          Breakdown
        </h3>
        {results.map((r, i) => {
          const car = carMap.get(r.car_id)
          return (
            <div
              key={i}
              className="bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{getScoreEmoji(r.score)}</span>
                <div className="min-w-0">
                  <p className="text-white text-sm font-semibold truncate">
                    {car ? `${car.year} ${car.make} ${car.model}` : `Car ${i + 1}`}
                  </p>
                  <p className="text-[#8b949e] text-xs">
                    Guessed {formatPrice(r.guess)} · Sold {formatPrice(r.actual)}
                  </p>
                </div>
              </div>
              <span className="text-white font-bold text-sm shrink-0 ml-3">
                {r.score} pts
              </span>
            </div>
          )
        })}
      </div>

      {/* Leaderboard with tabs */}
      <div className="w-full max-w-lg">
        <div className="flex gap-1 mb-3">
          <button
            onClick={() => { setLbTab('daily'); setExpandedRow(null) }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              lbTab === 'daily' ? 'bg-[#e63946] text-white' : 'bg-[#161b22] text-[#8b949e]'
            }`}
          >
            Daily
          </button>
          <button
            onClick={() => { setLbTab('weekly'); setExpandedRow(null) }}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
              lbTab === 'weekly' ? 'bg-[#e63946] text-white' : 'bg-[#161b22] text-[#8b949e]'
            }`}
          >
            Weekly
          </button>
        </div>

        {lbTab === 'daily' && (
          leaderboard.length === 0 ? (
            <p className="text-[#484f58] text-sm text-center py-4">No scores yet today</p>
          ) : (
            <div className="space-y-1">
              {leaderboard.map((entry, i) => {
                const isMe = entry.nickname.toLowerCase() === initialNickname.toLowerCase()
                  && entry.total_score === totalScore
                const expanded = expandedRow === entry.id
                return (
                  <div key={entry.id}>
                    <button
                      onClick={() => setExpandedRow(expanded ? null : entry.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left ${
                        isMe
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
                        <span className={`text-sm ${isMe ? 'text-white font-bold' : 'text-white font-medium'}`}>
                          {entry.nickname}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {isMe && (
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
              })}
            </div>
          )
        )}

        {lbTab === 'weekly' && (
          weeklyLb.length === 0 ? (
            <p className="text-[#484f58] text-sm text-center py-4">No scores this week yet</p>
          ) : (
            <div className="space-y-1">
              {weeklyLb.map((entry, i) => {
                const isMe = entry.nickname.toLowerCase() === initialNickname.toLowerCase()
                return (
                  <div
                    key={entry.nickname.toLowerCase()}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl ${
                      isMe
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
                      <span className={`text-sm ${isMe ? 'text-white font-bold' : 'text-white font-medium'}`}>
                        {entry.nickname}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isMe && (
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-[#e63946]/30 text-[#e63946] px-1.5 py-0.5 rounded">You</span>
                      )}
                      <span className="text-[#8b949e] text-xs mr-1">{entry.daysPlayed}/7</span>
                      <span className="text-white font-bold text-sm">{entry.weeklyScore}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        )}

        <button
          onClick={() => setShowModal(true)}
          className="text-[#8b949e] text-xs hover:text-white transition-colors mt-3 w-full text-center"
        >
          View full leaderboard →
        </button>
      </div>

      {showModal && (
        <LeaderboardModal
          onClose={() => setShowModal(false)}
          currentNickname={initialNickname}
          currentScore={totalScore}
        />
      )}
    </div>
  )
}
