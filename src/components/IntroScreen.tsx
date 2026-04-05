import { useState, useEffect } from 'react'
import type { DailySession, UserScore } from '../lib/types'
import { DEV_MODE } from '../lib/devmode'
import { getTodayStartIsrael } from '../lib/date'
import { supabase } from '../lib/supabase'
import LeaderboardModal from './LeaderboardModal'
import HowToPlay from './HowToPlay'
import { themeWithEmoji } from '../lib/themes'

interface IntroScreenProps {
  session: DailySession
  streak: number
  onStart: (nickname: string) => void
  onViewLeaderboard: () => void
}

function getPlayedToday(sessionDate: string): { nickname: string; score: number } | null {
  try {
    const raw = localStorage.getItem('bernie_played')
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.date === sessionDate) return data
  } catch {}
  return null
}

export default function IntroScreen({ session, streak, onStart }: IntroScreenProps) {
  const [nickname, setNickname] = useState(() => {
    try { return localStorage.getItem('bernie_nickname') || '' } catch { return '' }
  })
  const [top3, setTop3] = useState<UserScore[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showHowTo, setShowHowTo] = useState(false)
  const hasSeenHowTo = (() => {
    try { return !!localStorage.getItem('bernie_seen_howtoplay') } catch { return true }
  })()

  const dateFormatted = new Date(session.date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const played = DEV_MODE ? null : getPlayedToday(session.date)

  useEffect(() => {
    supabase
      .from('user_scores')
      .select('*')
      .eq('session_date', session.date)
      .gte('created_at', getTodayStartIsrael())
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data) setTop3(data)
      })
  }, [session.date])

  function handlePlay() {
    if (!nickname.trim()) return
    // Intercept first play to show How to Play
    if (!hasSeenHowTo) {
      setShowHowTo(true)
      return
    }
    startGame()
  }

  function startGame() {
    const name = DEV_MODE ? `DEV_${nickname.trim()}` : nickname.trim()
    if (!DEV_MODE) {
      try { localStorage.setItem('bernie_nickname', nickname.trim()) } catch {}
    }
    onStart(name)
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center px-6 text-center pt-8 sm:pt-14 relative">
      <div className="absolute top-3 right-3 flex items-center gap-2">
        {DEV_MODE && (
          <span className="text-[10px] font-mono font-bold bg-[#f97316]/20 text-[#f97316] px-2 py-0.5 rounded">
            DEV
          </span>
        )}
        <button
          onClick={() => setShowHowTo(true)}
          className="w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] text-xs font-bold flex items-center justify-center hover:text-white transition-colors"
        >
          ?
        </button>
      </div>
      <div className="mb-4">
        <h1 className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
          BERNIE
        </h1>
        <p className="text-[#e63946] font-semibold text-base tracking-widest uppercase mt-0.5">
          Daily
        </p>
      </div>

      <p className="text-[#8b949e] text-xs mb-1">{dateFormatted}</p>

      {session.season_name && (
        <p className="text-[#484f58] text-[10px] uppercase tracking-widest mb-1">
          {session.season_name}
        </p>
      )}

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-6 py-4 mb-4 max-w-sm w-full">
        <p className="text-[#8b949e] text-[10px] uppercase tracking-widest mb-1">Today's Theme</p>
        <h2 className="text-xl sm:text-2xl font-bold text-white">
          {themeWithEmoji(session.theme_name)}
        </h2>
        <p className="text-[#484f58] text-xs mt-1">
          {session.car_ids.length} cars · Guess the sold price
        </p>
      </div>

      {/* Top 3 peek */}
      <div className="w-full max-w-sm mb-4">
        {top3.length > 0 ? (
          <div>
            {top3.map((entry, i) => (
              <div key={entry.id} className="flex items-center justify-between px-3 py-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#484f58] text-xs font-bold w-5 text-right">
                    {i === 0 ? '👑' : `#${i + 1}`}
                  </span>
                  <span className="text-[#8b949e] text-xs">{entry.nickname}</span>
                </div>
                <span className="text-[#8b949e] text-xs font-medium">{entry.total_score} pts</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[#484f58] text-xs">No scores yet today — be the first! 🏁</p>
        )}
        <button
          onClick={() => setShowModal(true)}
          className="text-[#8b949e] text-xs hover:text-white transition-colors mt-1"
        >
          View full leaderboard →
        </button>
      </div>

      {played ? (
        <>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl px-6 py-4 mb-4 max-w-sm w-full">
            <p className="text-[#8b949e] text-[10px] uppercase tracking-widest mb-2">Already Played</p>
            <p className="text-white font-bold text-sm mb-1">{played.nickname}</p>
            <p className="text-4xl font-black text-white mb-0.5">{played.score}</p>
            <p className="text-[#8b949e] text-xs">/ 1000</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="bg-[#e63946] hover:bg-[#d62839] text-white font-bold text-sm px-8 py-3 rounded-xl transition-all mb-3"
          >
            View Leaderboard
          </button>

          <p className="text-[#484f58] text-xs mt-2">
            Come back tomorrow for a new set of cars
          </p>
        </>
      ) : (
        <>
          {streak > 0 && (
            <div className="mb-3 flex items-center gap-1.5">
              <span className="text-lg">🔥</span>
              <span className="text-white font-bold text-sm">{streak} day streak</span>
            </div>
          )}

          <div className="w-full max-w-sm mb-4">
            <p className="text-[#8b949e] text-[10px] uppercase tracking-widest mb-1.5">Your Name</p>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlay()}
              placeholder="Enter your name"
              maxLength={20}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-white text-center text-sm placeholder-[#484f58] outline-none focus:border-[#e63946] transition-colors"
            />
          </div>

          <button
            onClick={handlePlay}
            disabled={!nickname.trim()}
            className="bg-[#e63946] hover:bg-[#d62839] disabled:opacity-40 disabled:hover:bg-[#e63946] text-white font-bold text-base px-10 py-3.5 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(230,57,70,0.3)]"
          >
            Play Today's Session
          </button>

          <p className="text-[#484f58] text-xs mt-4">
            A new session drops every day at midnight
          </p>
        </>
      )}

      {showModal && (
        <LeaderboardModal
          onClose={() => setShowModal(false)}
          currentNickname={played?.nickname}
          currentScore={played?.score}
        />
      )}

      {showHowTo && (
        <HowToPlay onClose={() => {
          setShowHowTo(false)
          try { localStorage.setItem('bernie_seen_howtoplay', '1') } catch {}
          // If this was triggered by Play button (first time), start the game
          if (!hasSeenHowTo && nickname.trim()) {
            startGame()
          }
        }} />
      )}
    </div>
  )
}
