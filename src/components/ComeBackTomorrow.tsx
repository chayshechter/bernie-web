import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { themeWithEmoji } from '../lib/themes'

interface ComeBackTomorrowProps {
  tomorrowDate: string
}

function getMsUntilMidnightIsrael(): number {
  const now = new Date()
  const israelTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }))
  const midnight = new Date(israelTime)
  midnight.setDate(midnight.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  return midnight.getTime() - israelTime.getTime()
}

function formatCountdown(ms: number): string {
  const totalMin = Math.floor(ms / 60000)
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function isMobile(): boolean {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
}

export default function ComeBackTomorrow({ tomorrowDate }: ComeBackTomorrowProps) {
  const [tomorrowTheme, setTomorrowTheme] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(() => formatCountdown(getMsUntilMidnightIsrael()))
  const [nudgeDismissed, setNudgeDismissed] = useState(() => {
    try { return localStorage.getItem('bernie_home_nudge_dismissed') === '1' } catch { return true }
  })

  const streak = (() => {
    try { return parseInt(localStorage.getItem('bernie_streak') || '0') } catch { return 0 }
  })()

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
      setCountdown(formatCountdown(getMsUntilMidnightIsrael()))
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  function dismissNudge() {
    setNudgeDismissed(true)
    try { localStorage.setItem('bernie_home_nudge_dismissed', '1') } catch {}
  }

  const streakLabel =
    streak >= 7 ? "You're on fire! 🔥" :
    streak >= 2 ? "Don't break it!" :
    streak === 1 ? 'First game played!' :
    null

  const showMobileNudge = isMobile() && !nudgeDismissed

  return (
    <div
      className="w-full max-w-lg rounded-2xl overflow-hidden"
      style={{ background: '#1a1200', borderTop: '3px solid #f59e0b' }}
    >
      <div className="px-6 py-6 text-center">
        {/* Streak hero */}
        {streak > 0 && (
          <div className="mb-1">
            <div className="text-6xl leading-none mb-1">🔥</div>
            <div className="text-5xl font-black text-white leading-tight">{streak}</div>
            <p className="text-[#f59e0b] text-sm mt-1">
              {streak === 1 ? 'day streak' : `day streak`}
            </p>
            {streakLabel && (
              <p className="text-[#f59e0b]/70 text-xs mt-0.5">{streakLabel}</p>
            )}
          </div>
        )}

        {/* Tomorrow teaser */}
        {tomorrowTheme && (
          <>
            {streak > 0 && (
              <div className="my-4 border-t border-[#f59e0b]/15" />
            )}
            <div>
              <p className="text-[#f59e0b] text-[10px] font-bold uppercase tracking-widest mb-1">
                Tomorrow
              </p>
              <p className="text-white text-xl font-bold">{themeWithEmoji(tomorrowTheme)}</p>
              <p className="text-[#8b949e] text-xs mt-1">Starts in {countdown}</p>
            </div>
          </>
        )}

        {/* No tomorrow but has streak — show countdown standalone */}
        {!tomorrowTheme && streak > 0 && (
          <>
            <div className="my-4 border-t border-[#f59e0b]/15" />
            <p className="text-[#8b949e] text-xs">Next game in {countdown}</p>
          </>
        )}

        {/* No streak, no tomorrow — just countdown */}
        {!tomorrowTheme && streak === 0 && (
          <p className="text-[#8b949e] text-xs">Next game in {countdown}</p>
        )}

        {/* Add to home screen nudge */}
        {showMobileNudge && (
          <>
            <div className="my-4 border-t border-[#f59e0b]/15" />
            <div className="flex items-center justify-center gap-2">
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
          </>
        )}
      </div>
    </div>
  )
}
