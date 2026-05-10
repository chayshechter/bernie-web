import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
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
      .from('daily_sets')
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
      {streak > 0 ? (
        <div className="w-full rounded-2xl border border-[rgba(245,158,11,0.55)] bg-[#1d1408] px-5 py-5 grid grid-cols-[1fr_1px_1.2fr] items-center gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="font-display text-[44px] leading-none text-[#f59e0b] tracking-[-0.02em]">{streak}</span>
              <span className="text-[13px] font-semibold text-[#f59e0b] tracking-[0.04em]">day streak</span>
            </div>
            {streakLabel && (
              <p className="mt-1.5 text-[11px] text-[#b97a07]">{streakLabel}</p>
            )}
          </div>
          <div className="h-[60%] bg-[rgba(245,158,11,0.55)]" />
          <div>
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#b97a07] mb-1.5">NEXT GAME IN</p>
            <p className="font-mono text-[22px] font-semibold text-white tracking-[0.04em]">{countdown}</p>
            <p className="mt-1.5 text-[11px] text-[#b97a07] tracking-[0.06em]">
              NEXT UP — {(tomorrowTheme ?? 'Coming Soon').toUpperCase()}
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full rounded-2xl border border-[rgba(245,158,11,0.55)] bg-[#1d1408] px-5 py-5 text-center">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#b97a07] mb-1.5">NEXT GAME IN</p>
          <p className="font-mono text-[28px] font-semibold text-white tracking-[0.04em]">{countdown}</p>
          <p className="mt-1.5 text-[11px] text-[#b97a07] tracking-[0.06em]">
            NEXT UP — {(tomorrowTheme ?? 'Coming Soon').toUpperCase()}
          </p>
        </div>
      )}

      {/* Add to home screen nudge */}
      {showMobileNudge && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <p className="text-[#535862] text-[11px]">
            Tip: Add to home screen for quick daily access
          </p>
          <button
            onClick={dismissNudge}
            className="text-[#535862] text-[11px] hover:text-[#888] shrink-0"
          >
            ✕
          </button>
        </div>
      )}
    </>
  )
}
