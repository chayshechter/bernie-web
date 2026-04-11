import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { themeWithEmoji } from '../lib/themes'
import { getMsUntilMidnightEastern, formatCountdown, getTomorrowEastern } from '../lib/date'

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export default function ComeBackTomorrow() {
  const [tomorrowTheme, setTomorrowTheme] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(() => formatCountdown(getMsUntilMidnightEastern()))
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try { return localStorage.getItem('bernie_home_nudge_dismissed') === '1' } catch { return true }
  })

  const streak = (() => {
    try { return parseInt(localStorage.getItem('bernie_streak') || '0') } catch { return 0 }
  })()

  const tomorrowDate = getTomorrowEastern()

  useEffect(() => {
    supabase
      .from('daily_sessions')
      .select('theme_name')
      .eq('date', tomorrowDate)
      .single()
      .then(({ data }) => {
        if (data) setTomorrowTheme(data.theme_name)
      })
  }, [tomorrowDate])

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(formatCountdown(getMsUntilMidnightEastern()))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  function dismissNudge() {
    setNudgeDismissed(true)
    try { localStorage.setItem('bernie_home_nudge_dismissed', '1') } catch {}
  }

  const streakLabel =
    streak >= 7 ? "You're on fire!" :
    streak >= 2 ? "Don't break it!" :
    streak === 1 ? 'First game played!' :
    null

  const showMobileNudge = isMobile() && !nudgeDismissed

  return (
    <>
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ background: '#1a1200', borderTop: '3px solid #f59e0b' }}
      >
        {streak > 0 ? (
          <div className="flex items-center px-4 py-5">
            {/* Left — Streak */}
            <div className="flex-1 text-center">
              <div className="text-3xl leading-none mb-1">🔥</div>
              <div className="text-4xl font-black text-white leading-tight">{streak}</div>
              <p className="text-[#f59e0b] text-xs mt-0.5">day streak</p>
              {streakLabel && (
                <p className="text-[#f59e0b]/70 text-[10px] mt-0.5">{streakLabel}</p>
              )}
            </div>

            {/* Divider */}
            <div className="w-px self-stretch bg-[#f59e0b]/20 mx-3" />

            {/* Right — Countdown */}
            <div className="flex-1 text-center">
              <p className="text-[#f59e0b] text-[9px] font-bold uppercase tracking-widest mb-1">
                Next game in
              </p>
              <p className="text-white text-2xl font-black font-mono tracking-wider">
                {countdown}
              </p>
              <p className="text-[#8b949e] text-[9px] mt-1 uppercase tracking-widest leading-tight">
                Next up — {tomorrowTheme ? themeWithEmoji(tomorrowTheme) : 'Coming Soon'}
              </p>
            </div>
          </div>
        ) : (
          <div className="px-5 py-5 text-center">
            <p className="text-[#f59e0b] text-[10px] font-bold uppercase tracking-widest mb-1">
              Next game in
            </p>
            <p className="text-white text-3xl font-black font-mono tracking-wider">
              {countdown}
            </p>
            <p className="text-[#8b949e] text-[9px] mt-1 uppercase tracking-widest">
              Next up — {tomorrowTheme ? themeWithEmoji(tomorrowTheme) : 'Coming Soon'}
            </p>
          </div>
        )}
      </div>

      {/* Add to home screen nudge */}
      {showMobileNudge && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <p className="text-[#555] text-[11px]">
            Tip: Add to home screen for quick daily access
          </p>
          <button
            onClick={dismissNudge}
            className="text-[#555] text-[11px] hover:text-[#888] shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
