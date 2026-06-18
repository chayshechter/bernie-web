import { useEffect, useRef, useState } from 'react'
import type { Car, GuessResult, UserScore } from '../lib/types'
import type { ScoreTier } from '../types/community'
import { generateShareText } from '../lib/scoring'
import { supabase } from '../lib/supabase'
import { DEV_MODE } from '../lib/devmode'
import {
  getYesterdayEastern,
  getTodayStartEastern,
  getPuzzleNumber,
  formatIssueDate,
} from '../lib/date'
import { Analytics } from '../lib/analytics'
import { getDeviceId } from '../lib/deviceId'
import { useCountdown } from '../lib/useCountdown'
import { getRankInfo, getTomorrowTheme, subscribeEmail } from '../lib/supabase-community'
import LeaderboardModal from './LeaderboardModal'
import HowToPlay from './HowToPlay'
import FeedbackModal from './FeedbackModal'
import HelpMenu from './HelpMenu'
import type { HelpAction } from './HelpMenu'

interface ResultsScreenV2Props {
  results: GuessResult[]
  cars: Car[]
  nickname: string
  themeName: string
  sessionDate: string
  totalScore: number
  /**
   * Returning player who already played + saved today. Skips the score
   * re-submit (would 23505-conflict + double-count the streak) and the
   * one-time "+1" pill. Layout/design are unchanged.
   */
  returning?: boolean
}

const EMAIL_KEY = 'bernie_email_subscribed'
// Marks that the v2 results screen has been shown today, so the "+1 keep it
// going" pill only ever appears on the very first view of the day.
const SEEN_KEY = 'bernie_v2_seen_today'

function seenTodayFlag(sessionDate: string): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === sessionDate
  } catch {
    return false
  }
}

function tierForScore(score: number): ScoreTier {
  if (score >= 95) return 'perfect'
  if (score >= 80) return 'strong'
  if (score >= 60) return 'close'
  if (score >= 40) return 'miss'
  return 'cold'
}

const STRIP_COLOR: Record<ScoreTier, string> = {
  perfect: 'bg-success',
  strong: 'bg-success',
  close: 'bg-streak',
  miss: 'bg-warn',
  cold: 'bg-brand',
}

// Points text color, mapped to the same tiers as the scorecard squares so a
// glance at a car cell reads consistently with the colored strip up top.
const TIER_TEXT: Record<ScoreTier, string> = {
  perfect: 'text-success',
  strong: 'text-success',
  close: 'text-streak',
  miss: 'text-warn',
  cold: 'text-brand',
}

// Compact currency for the dense 2-col grid: "$32.5k", "$120k", "$950".
function compactPrice(n: number): string {
  if (!n) return '$0'
  if (n >= 1000) {
    const k = n / 1000
    const val = k >= 100 ? String(Math.round(k)) : k.toFixed(1).replace(/\.0$/, '')
    return `$${val}k`
  }
  return `$${Math.round(n)}`
}

function resolveCarImage(car: Car): string | null {
  if (car.hero_image_url) return car.hero_image_url
  const imgs = car.images
  if (Array.isArray(imgs)) return imgs[0] ?? null
  if (typeof imgs === 'string' && imgs.trim()) {
    try {
      const parsed = JSON.parse(imgs)
      if (Array.isArray(parsed)) return parsed[0] ?? null
    } catch {
      // not JSON — treat as comma-list or a single URL
      return imgs.split(',')[0].trim() || null
    }
    return imgs
  }
  return null
}

// ─── streak snapshot (read once, before the DB write touches localStorage) ──
function readStreakSnapshot(sessionDate: string) {
  const current = parseInt(localStorage.getItem('bernie_streak') || '0', 10)
  const lastPlayed = localStorage.getItem('bernie_last_played')
  if (DEV_MODE) {
    return { streak: current || 1, justTicked: false }
  }
  const alreadyPlayedToday = lastPlayed === sessionDate
  const newStreak = alreadyPlayedToday
    ? current || 1
    : lastPlayed === getYesterdayEastern()
      ? current + 1
      : 1
  return { streak: newStreak, justTicked: !alreadyPlayedToday }
}

export default function ResultsScreenV2({
  results,
  cars,
  nickname,
  themeName,
  sessionDate,
  totalScore,
  returning = false,
}: ResultsScreenV2Props) {
  const countdown = useCountdown()

  const [{ streak, justTicked }] = useState(() => {
    const snap = readStreakSnapshot(sessionDate)
    // Pill is a once-per-day reward: never for returning visits, and never
    // once today's results have already been seen.
    const pill = snap.justTicked && !returning && !seenTodayFlag(sessionDate)
    return { streak: snap.streak, justTicked: pill }
  })

  const [submitState, setSubmitState] =
    useState<'saving' | 'saved' | 'conflict' | 'error'>('saving')
  const [fallbackNickname, setFallbackNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const didSubmit = useRef(false)

  const [rankLabel, setRankLabel] = useState<string | null>(null)
  const [playedCount, setPlayedCount] = useState<number | null>(null)
  const [tomorrowTheme, setTomorrowTheme] = useState<string | null>(null)

  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState<boolean>(
    () => !!localStorage.getItem(EMAIL_KEY),
  )
  const [emailError, setEmailError] = useState<string | null>(null)

  const [leaderboard, setLeaderboard] = useState<UserScore[]>([])
  const [showModal, setShowModal] = useState(false)
  const [shared, setShared] = useState(false)

  const [showHowTo, setShowHowTo] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [showHelpMenu, setShowHelpMenu] = useState(false)
  const [feedbackCategory, setFeedbackCategory] = useState<'bug' | 'suggestion'>('suggestion')

  const heroRef = useRef<HTMLDivElement>(null)
  const [showSticky, setShowSticky] = useState(false)

  const resultByCar = new Map(results.map((r) => [r.car_id, r]))

  // ── submit score (mirrors ResultsScreen; we don't import it so it stays
  //    untouched) ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (didSubmit.current) return
    didSubmit.current = true
    // Mark today's results as seen so the "+1" pill won't reappear later.
    try {
      localStorage.setItem(SEEN_KEY, sessionDate)
    } catch {
      /* storage unavailable */
    }
    if (returning) {
      // Score already saved on the original play. Re-submitting would
      // 23505-conflict and double-count the streak; just surface the saved
      // state so rank + leaderboard load. Votes/reactions hydrate per-card
      // via useCarEngagement (device_id scoped).
      setSubmitState('saved')
      return
    }
    Analytics.gameCompleted(totalScore, themeName)
    submitScore(nickname)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function submitScore(name: string) {
    setSubmitting(true)
    const { error } = await supabase.from('user_scores').insert({
      session_date: sessionDate,
      nickname: name.trim(),
      guesses: results,
      total_score: totalScore,
      device_id: getDeviceId(),
    })
    setSubmitting(false)

    if (error) {
      setSubmitState(error.code === '23505' ? 'conflict' : 'error')
      return
    }

    supabase
      .from('guesses')
      .insert(
        results.map((r) => ({
          player_name: name.trim(),
          car_id: r.car_id,
          guessed_price: r.guess,
          actual_price: r.actual,
          score: r.score,
        })),
      )
      .then(({ error: gErr }) => {
        if (gErr) console.error('[bernie] Failed to save guesses:', gErr.message)
      })

    if (!DEV_MODE) {
      const lastPlayed = localStorage.getItem('bernie_last_played')
      const currentStreak = parseInt(localStorage.getItem('bernie_streak') || '0', 10)
      const newStreak = lastPlayed === getYesterdayEastern() ? currentStreak + 1 : 1
      try {
        localStorage.setItem('bernie_streak', String(newStreak))
        localStorage.setItem('bernie_last_played', sessionDate)
        localStorage.setItem(
          'bernie_played',
          JSON.stringify({ date: sessionDate, nickname: name.trim(), score: totalScore }),
        )
      } catch {
        /* storage unavailable */
      }
    }

    setSubmitState('saved')
  }

  async function handleRetrySubmit() {
    if (!fallbackNickname.trim()) return
    try {
      localStorage.setItem('bernie_nickname', fallbackNickname.trim())
    } catch {
      /* ignore */
    }
    await submitScore(fallbackNickname.trim())
  }

  // ── rank + tomorrow's theme ───────────────────────────────────────────────
  useEffect(() => {
    if (submitState !== 'saved') return
    getRankInfo(totalScore, sessionDate)
      .then(({ rank, percentile, totalPlayers }) => {
        setPlayedCount(totalPlayers)
        if (totalPlayers <= 1) return
        setRankLabel(rank <= 100 ? `#${rank} today` : `Top ${percentile}% today`)
      })
      .catch((err) => console.error('[bernie] getRankInfo failed:', err))
  }, [submitState, totalScore, sessionDate])

  useEffect(() => {
    getTomorrowTheme()
      .then(setTomorrowTheme)
      .catch((err) => console.error('[bernie] getTomorrowTheme failed:', err))
  }, [])

  // ── top-6 leaderboard ────────────────────────────────────────────────────
  useEffect(() => {
    supabase
      .from('user_scores')
      .select('*')
      .eq('session_date', sessionDate)
      .gte('created_at', getTodayStartEastern())
      .not('nickname', 'ilike', 'DEV_%')
      .order('total_score', { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setLeaderboard(data)
      })
  }, [submitState, sessionDate])

  // ── sticky bar: show once the streak hero has scrolled out of view ───────
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting && entry.boundingClientRect.top < 0)
      },
      { threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  async function handleSubscribe() {
    setEmailError(null)
    const value = email.trim().toLowerCase()
    try {
      await subscribeEmail(value, getDeviceId())
      try {
        localStorage.setItem(EMAIL_KEY, value)
      } catch {
        /* ignore */
      }
      setSubscribed(true)
    } catch {
      setEmailError('That email doesn’t look right.')
    }
  }

  async function handleShare() {
    Analytics.scoreShared()
    const text = generateShareText(
      themeName,
      sessionDate,
      results.map((r) => r.score),
      totalScore,
    )
    if (navigator.share) {
      try {
        await navigator.share({ text })
        setShared(true)
        setTimeout(() => setShared(false), 2000)
        return
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(text)
    } catch {
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

  const nextUpTheme = tomorrowTheme ?? 'a fresh set'

  return (
    <div className="min-h-screen bg-base text-white pb-24 relative">
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={() => setShowHelpMenu(true)}
          className="w-7 h-7 rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] text-xs font-bold flex items-center justify-center hover:text-white transition-colors"
          aria-label="Help menu"
        >
          ?
        </button>
      </div>
      <style>{`
        @keyframes v2-flip-in {
          0%   { transform: translateY(-40%) rotateX(-80deg); opacity: 0 }
          60%  { transform: translateY(6%) rotateX(8deg); opacity: 1 }
          100% { transform: translateY(0) rotateX(0); opacity: 1 }
        }
        @keyframes v2-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,0) }
          50%     { box-shadow: 0 0 0 8px rgba(245,158,11,.06) }
        }
        .v2-flip { display:inline-block; transform-origin:50% 100%;
          animation: v2-flip-in .8s cubic-bezier(.2,.8,.2,1) both }
        .v2-pulse { animation: v2-pulse 2s ease-in-out infinite }
      `}</style>

      {/* top bar + wordmark */}
      <div className="flex items-center justify-between px-5 pt-4 font-mono text-faint text-[11px] tracking-[0.14em]">
        <span>NO. {String(getPuzzleNumber(sessionDate)).padStart(3, '0')}</span>
        <span>{formatIssueDate(sessionDate)}</span>
      </div>
      <div className="text-center pt-1.5 pb-1.5 mx-4 border-b border-[#252a32]">
        <div className="text-[30px] font-display font-black tracking-tighter text-white">
          BERNIE
        </div>
        <div className="text-brand text-[10px] tracking-[0.32em] font-bold mt-0.5">
          DAILY
        </div>
      </div>

      {/* streak band (compact — keeps streak + countdown in the screenshot
          without eating a full viewport; full "don't break it" hero lives
          below the scorecard) */}
      <div ref={heroRef} className="mt-4 mx-4">
        <div
          className="flex items-center justify-center gap-2.5 rounded-full px-4 py-2 bg-streak-bg text-streak text-[12px] font-bold tracking-[0.06em]"
          style={{ border: '1px solid color-mix(in oklab, #f59e0b 35%, transparent)' }}
        >
          <span className="whitespace-nowrap">🔥 STREAK {streak}</span>
          <span className="text-streak/45">·</span>
          <span className="font-mono tabular-nums whitespace-nowrap">
            NEXT {String(countdown.hours).padStart(2, '0')}:
            {String(countdown.minutes).padStart(2, '0')}:
            {String(countdown.seconds).padStart(2, '0')}
          </span>
        </div>
        {justTicked && (
          <div className="text-center mt-2">
            <span className="v2-pulse inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold tracking-[0.04em] text-streak bg-streak/15">
              +1 — KEEP IT GOING
            </span>
          </div>
        )}
      </div>

      {/* score block */}
      <div className="px-4 pt-5 pb-1 text-center">
        <div className="text-muted text-[10px] tracking-[0.18em] uppercase font-semibold mb-2">
          YOUR SCORE
        </div>
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-white font-display font-black text-[64px] leading-[0.9] tracking-[-0.04em]">
            {totalScore}
          </span>
          <span className="text-faint font-mono text-base font-semibold tracking-[0.04em]">
            / 1000
          </span>
        </div>
        <div className="text-muted text-[12px] mt-2">
          {rankLabel && <span className="text-white font-bold">{rankLabel}</span>}
          {rankLabel && playedCount ? <span className="text-faint mx-1.5">·</span> : null}
          {playedCount ? <span>{playedCount} played</span> : null}
        </div>
        <div className="flex justify-center gap-1.5 mt-3">
          {cars.map((c) => {
            const score = resultByCar.get(c.id)?.score ?? 0
            return (
              <div
                key={c.id}
                className={`w-5 h-5 rounded-[5px] ${STRIP_COLOR[tierForScore(score)]}`}
                style={{ boxShadow: 'inset 0 -2px 0 rgba(0,0,0,.25)' }}
              />
            )
          })}
        </div>

        {submitState === 'saving' && (
          <p className="text-muted text-xs mt-4">Saving your score…</p>
        )}
        {submitState === 'error' && (
          <p className="text-brand text-xs mt-4">Failed to save score.</p>
        )}
        {submitState === 'conflict' && (
          <div className="mt-4 text-left">
            <p className="text-brand text-xs mb-2">
              “{nickname}” already played today. Pick a different name:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={fallbackNickname}
                onChange={(e) => setFallbackNickname(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleRetrySubmit()}
                placeholder="New nickname"
                maxLength={20}
                className="flex-1 min-w-0 bg-base border border-default rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-brand"
              />
              <button
                onClick={handleRetrySubmit}
                disabled={!fallbackNickname.trim() || submitting}
                className="bg-brand disabled:opacity-40 text-white font-bold text-sm px-4 rounded-lg"
              >
                {submitting ? '…' : 'Save'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* car grid — compact 2-col so all 10 cars + the score above fit in
          roughly one phone screenshot */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4">
        {cars.map((car, i) => (
          <CompactCarCell
            key={car.id}
            car={car}
            pos={i + 1}
            result={resultByCar.get(car.id)}
          />
        ))}
      </div>

      {/* ── below the fold: everything that shouldn't land in the screenshot ── */}

      {/* share CTA */}
      <div className="px-4 pt-5">
        <button
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2.5 bg-brand hover:bg-brand-hover active:translate-y-px text-white rounded-xl py-4 text-base font-bold transition-all"
          style={{
            boxShadow:
              '0 0 0 4px rgba(230,57,70,.08), 0 0 24px rgba(230,57,70,.35)',
          }}
        >
          <span className="text-xl leading-none">🏎️</span>
          {shared ? 'Copied!' : 'Share My Score'}
        </button>
      </div>

      {/* reminder card */}
      <div className="mt-6 mx-4 bg-surface-1 border border-default border-l-[3px] border-l-brand rounded-xl px-4 pt-4 pb-3.5">
        <div className="text-brand text-[10px] tracking-[0.18em] uppercase font-semibold">
          🔔 GET TOMORROW&apos;S SET
        </div>
        {subscribed ? (
          <>
            <div className="flex items-center gap-2.5 mt-2.5 text-success font-semibold text-sm">
              <span className="w-5 h-5 rounded-full bg-success/15 text-success inline-flex items-center justify-center text-[12px] font-black">
                ✓
              </span>
              You&apos;re on the list — we&apos;ll ping you at 9am ET.
            </div>
            <p className="text-muted text-[11.5px] mt-2">
              Unsubscribe anytime from any email.
            </p>
          </>
        ) : (
          <>
            <h3 className="mt-1.5 mb-1 text-[17px] font-bold tracking-[-0.01em]">
              Drop your email. We&apos;ll ping you at 9am ET.
            </h3>
            <div className="flex gap-2 mt-3">
              <input
                type="email"
                placeholder="you@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
                className="flex-1 min-w-0 bg-base border border-default text-white rounded-[9px] px-3 py-2.5 text-sm outline-none focus:border-brand"
              />
              <button
                onClick={handleSubscribe}
                className="bg-brand hover:bg-brand-hover text-white rounded-[9px] px-3.5 py-2.5 text-[13.5px] font-bold whitespace-nowrap"
              >
                Remind me
              </button>
            </div>
            {emailError ? (
              <p className="text-brand text-[11.5px] mt-2">{emailError}</p>
            ) : (
              <p className="text-muted text-[11.5px] mt-2">
                One email a day. Unsubscribe anytime. No spam ever.
              </p>
            )}
          </>
        )}
      </div>

      {/* leaderboard (deprioritized) */}
      <div className="mt-[22px] mx-4 bg-surface-1 border border-default rounded-xl px-4 py-3.5">
        <div className="flex items-center justify-between mb-2.5">
          <div className="text-muted text-[10px] tracking-[0.18em] uppercase font-semibold">
            TODAY&apos;S LEADERBOARD
          </div>
          {playedCount != null && (
            <div className="text-faint text-[10px] tracking-[0.18em] uppercase">
              {playedCount} PLAYED
            </div>
          )}
        </div>
        {leaderboard.length === 0 ? (
          <p className="text-faint text-sm text-center py-3">No scores yet today</p>
        ) : (
          leaderboard.map((entry, i) => {
            const isMe =
              entry.nickname.toLowerCase() === nickname.toLowerCase() &&
              entry.total_score === totalScore
            return (
              <div
                key={entry.id}
                className={`flex items-center justify-between text-[13.5px] ${
                  isMe
                    ? 'bg-brand/[0.07] border border-brand/40 rounded-lg px-2.5 py-2 my-1.5 -mx-2'
                    : 'py-2 border-t border-[#252a32] first:border-t-0'
                }`}
              >
                <div className="w-8 text-faint font-bold tabular-nums">
                  {i === 0 ? '👑' : `#${i + 1}`}
                </div>
                <div className="flex-1 text-white font-semibold">{entry.nickname}</div>
                {isMe && (
                  <div className="bg-brand text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded mr-2 tracking-[0.05em]">
                    YOU
                  </div>
                )}
                <div className="text-white font-extrabold tabular-nums">
                  {entry.total_score}
                </div>
              </div>
            )
          })
        )}
        <button
          onClick={() => setShowModal(true)}
          className="block w-full text-center text-muted hover:text-body text-xs mt-2.5 py-1.5"
        >
          View full leaderboard →
        </button>
      </div>

      {/* end hook */}
      <div
        className="relative overflow-hidden mt-7 mx-4 mb-2 rounded-[18px] px-[22px] pt-[30px] pb-[26px] text-center bg-streak-bg"
        style={{ border: '1px solid color-mix(in oklab, #f59e0b 35%, transparent)' }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(100% 60% at 50% 0%, rgba(245,158,11,.10), transparent 60%)',
          }}
        />
        <div className="relative">
          <div className="text-streak text-[10px] tracking-[0.18em] uppercase font-semibold">
            NEXT SET IN
          </div>
          <div className="font-mono tabular-nums text-[46px] font-extrabold text-white mt-1.5">
            <span>{String(countdown.hours).padStart(2, '0')}</span>
            <span className="text-streak">:</span>
            <span>{String(countdown.minutes).padStart(2, '0')}</span>
            <span className="text-streak">:</span>
            <span>{String(countdown.seconds).padStart(2, '0')}</span>
          </div>
          <h2 className="text-[26px] font-black tracking-[-0.02em] leading-[1.05] my-4">
            Don&apos;t break
            <br />
            your streak.
          </h2>
          <div className="text-streak text-[13px] font-semibold mb-4">
            🔥 {streak} {streak === 1 ? 'day' : 'days'} strong
          </div>
          {subscribed ? (
            <div className="text-success font-semibold text-sm inline-flex items-center gap-2">
              <span className="w-[22px] h-[22px] rounded-full bg-success/20 inline-flex items-center justify-center text-[13px] font-black text-success">
                ✓
              </span>
              We&apos;ll remind you at 9am ET
            </div>
          ) : (
            <button
              onClick={handleSubscribe}
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white px-5 py-3 rounded-[10px] text-sm font-bold"
              style={{ boxShadow: '0 0 24px rgba(230,57,70,.32)' }}
            >
              🔔 Remind me tomorrow
            </button>
          )}
          <div className="mt-3.5 text-muted text-xs italic">
            Next up — <b className="text-body not-italic font-semibold">{nextUpTheme}</b>
          </div>
        </div>
      </div>

      {/* sticky bottom bar */}
      <div
        className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 flex items-center justify-between gap-2.5 px-4 py-2.5 border-t border-default transition-transform duration-300 ${
          showSticky ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          background: 'rgba(13,17,23,.92)',
          backdropFilter: 'blur(14px) saturate(140%)',
        }}
      >
        <div className="text-streak font-extrabold text-[15px] flex items-baseline gap-1.5 whitespace-nowrap">
          🔥 {streak}
          <span className="text-streak/65 font-semibold text-[10px] tracking-[0.12em] uppercase">
            streak
          </span>
        </div>
        <div className="font-mono tabular-nums text-white text-[13px] font-bold flex items-baseline gap-1.5 whitespace-nowrap">
          <span className="text-muted font-semibold text-[10px] tracking-[0.12em] uppercase">
            Next
          </span>
          {countdown.formatted}
        </div>
      </div>

      {showModal && (
        <LeaderboardModal
          onClose={() => setShowModal(false)}
          currentNickname={nickname}
          currentScore={totalScore}
        />
      )}

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}

      {showHelpMenu && (
        <HelpMenu
          onClose={() => setShowHelpMenu(false)}
          onSelect={(action: HelpAction) => {
            setShowHelpMenu(false)
            if (action === 'how-to-play') {
              setShowHowTo(true)
            } else {
              setFeedbackCategory(action === 'bug' ? 'bug' : 'suggestion')
              setShowFeedback(true)
            }
          }}
        />
      )}

      <FeedbackModal
        isOpen={showFeedback}
        onClose={() => setShowFeedback(false)}
        initialCategory={feedbackCategory}
        context={{
          final_score: totalScore,
          last_car_id: results.length > 0 ? results[results.length - 1].car_id : null,
          screen: 'results',
        }}
      />
    </div>
  )
}

// ─── compact car cell (2-col grid) ──────────────────────────────────────────
// Thumbnail + name + guess→sold + tier-colored points, sized so all 10 cars
// land inside one phone screenshot. The guess→sold row is the payload of a
// shared scorecard, so it owns a full-width line that never wraps or
// truncates; only the car name is allowed to clip when space is tight.
function CompactCarCell({
  car,
  pos,
  result,
}: {
  car: Car
  pos: number
  result?: GuessResult
}) {
  const img = resolveCarImage(car)
  const score = result?.score ?? 0
  const tier = tierForScore(score)

  return (
    <div className="flex bg-surface-1 border border-default rounded-[10px] overflow-hidden">
      <div className="relative w-[58px] shrink-0 bg-[#0a0d12]">
        {img ? (
          <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(135deg,#1c2129 0%,#0a0d12 50%,#161b22 100%)',
            }}
          />
        )}
        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md text-white font-extrabold text-[9px] px-1 py-px rounded">
          #{pos}
        </div>
      </div>

      <div className="flex-1 min-w-0 px-2.5 py-2">
        {/* name (truncates) + points (tier-colored, never clipped) */}
        <div className="flex items-start justify-between gap-1.5">
          <div className="min-w-0 truncate text-[12.5px] font-bold leading-tight">
            {car.year} {car.make} {car.model}
          </div>
          <div
            className={`shrink-0 text-[13px] font-extrabold tabular-nums leading-none ${TIER_TEXT[tier]}`}
          >
            {score}
          </div>
        </div>

        {/* guess → sold: full-width, never wraps or truncates */}
        <div className="mt-1.5 flex items-baseline gap-1 text-[11px] tabular-nums whitespace-nowrap">
          <span className="text-muted">{compactPrice(result?.guess ?? 0)}</span>
          <span className="text-faint">→</span>
          <span className="text-white font-semibold">{compactPrice(result?.actual ?? 0)}</span>
        </div>
      </div>
    </div>
  )
}
