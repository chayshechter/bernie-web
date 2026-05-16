import { useState, useEffect } from 'react'
import type { Car, DailySet, GuessResult } from '../lib/types'
import { supabase } from '../lib/supabase'
import { getTodayEastern } from '../lib/date'
import { getDeviceId } from '../lib/deviceId'
import { DEV_MODE } from '../lib/devmode'
import IntroScreen from '../components/IntroScreen'
import GameScreen from '../components/GameScreen'
import ResultsScreen from '../components/ResultsScreen'
import ResultsScreenV2 from '../components/ResultsScreenV2'
import LeaderboardScreen from '../components/LeaderboardScreen'
import { useCommunityEnabled } from '../lib/featureFlag'

type Screen = 'loading' | 'intro' | 'game' | 'results' | 'leaderboard'

function getPlayedToday(
  sessionDate: string,
): { nickname: string; score: number } | null {
  try {
    const raw = localStorage.getItem('bernie_played')
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data?.date === sessionDate) return data
  } catch {
    /* ignore */
  }
  return null
}

// Resolved state for a returning community player. `null` (initial) means
// "still resolving" and renders as the plain loading screen.
type Returning =
  | { status: 'fallback' }
  | { status: 'ready'; results: GuessResult[]; nickname: string; totalScore: number }

export default function Game() {
  const communityEnabled = useCommunityEnabled()
  const [screen, setScreen] = useState<Screen>('loading')
  const [session, setSession] = useState<DailySet | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [results, setResults] = useState<GuessResult[]>([])
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [returning, setReturning] = useState<Returning | null>(null)

  // One-time fix: clear stale played lock after Apr 11 theme swap.
  // Runs synchronously before first render so IntroScreen sees the cleared state.
  useState(() => {
    try {
      if (!localStorage.getItem('bernie_theme_reset_2026_04_11')) {
        const played = localStorage.getItem('bernie_played')
        if (played) {
          const data = JSON.parse(played)
          if (data?.date === '2026-04-11') {
            localStorage.removeItem('bernie_played')
          }
        }
        localStorage.setItem('bernie_theme_reset_2026_04_11', '1')
      }
    } catch {}
  })

  const streak = parseInt(localStorage.getItem('bernie_streak') || '0')

  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [screen])

  useEffect(() => {
    loadTodaysSession()
  }, [])

  // Returning community player: if they already played today, load their
  // saved score so we can show them their real ResultsScreenV2 instead of
  // the "already played" home card.
  useEffect(() => {
    if (screen !== 'intro' || !session) return
    if (!communityEnabled || DEV_MODE) return
    if (!getPlayedToday(session.date)) return

    let cancelled = false
    ;(async () => {
      const { data, error: fetchErr } = await supabase
        .from('user_scores')
        .select('nickname, total_score, guesses')
        .eq('session_date', session.date)
        .eq('device_id', getDeviceId())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (cancelled) return

      if (
        fetchErr ||
        !data ||
        !Array.isArray(data.guesses) ||
        data.guesses.length === 0
      ) {
        // device_id mismatch / data gap → fall back to ComeBackTomorrow.
        setReturning({ status: 'fallback' })
        return
      }

      setReturning({
        status: 'ready',
        results: data.guesses as GuessResult[],
        nickname: data.nickname,
        totalScore: data.total_score,
      })
    })()

    return () => {
      cancelled = true
    }
  }, [screen, session, communityEnabled])

  async function loadTodaysSession() {
    const params = new URLSearchParams(window.location.search)
    const today = params.get('date') || getTodayEastern()

    const { data: sessionData, error: sessionError } = await supabase
      .from('daily_sets')
      .select('*')
      .eq('date', today)
      .single()

    if (sessionError || !sessionData) {
      setError('No session found for today. Check back later!')
      setScreen('intro')
      return
    }

    setSession(sessionData)

    const { data: carsData, error: carsError } = await supabase
      .from('cars')
      .select('*')
      .in('id', sessionData.car_ids)

    if (carsError || !carsData) {
      setError('Failed to load cars.')
      setScreen('intro')
      return
    }

    const carMap = new Map(carsData.map((c) => [c.id, c]))
    const orderedCars = sessionData.car_ids
      .map((id: string) => carMap.get(id))
      .filter(Boolean) as Car[]

    setCars(orderedCars)
    setScreen('intro')
  }

  function handleStart(name: string) {
    setNickname(name)
    setScreen('game')
  }

  function handleComplete(guessResults: GuessResult[]) {
    setResults(guessResults)
    setScreen('results')
  }

  if (screen === 'loading') {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-5xl font-black text-white tracking-tighter mb-2">BERNIE</h1>
          <p className="text-[#e63946] font-semibold tracking-widest text-sm uppercase">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-6 text-center">
        <h1 className="text-5xl font-black text-white tracking-tighter mb-4">BERNIE</h1>
        <p className="text-[#e63946] font-semibold tracking-widest text-sm uppercase mb-6">Daily</p>
        <p className="text-zinc-400 text-lg">{error}</p>
      </div>
    )
  }

  if (screen === 'intro') {
    const playedToday = !DEV_MODE && !!getPlayedToday(session.date)

    if (communityEnabled && playedToday) {
      if (returning?.status === 'ready') {
        return (
          <ResultsScreenV2
            returning
            results={returning.results}
            cars={cars}
            nickname={returning.nickname}
            themeName={session.theme_name}
            sessionDate={session.date}
            totalScore={returning.totalScore}
          />
        )
      }
      // Still resolving (null | 'loading') → show the plain loading state so
      // we never flash the ComeBackTomorrow home card first.
      if (returning?.status !== 'fallback') {
        return (
          <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-5xl font-black text-white tracking-tighter mb-2">BERNIE</h1>
              <p className="text-[#e63946] font-semibold tracking-widest text-sm uppercase">
                Loading...
              </p>
            </div>
          </div>
        )
      }
      // 'fallback' → drop through to the unchanged IntroScreen (its played
      // card already renders ComeBackTomorrow).
    }

    return (
      <IntroScreen
        session={session}
        streak={streak}
        onStart={handleStart}
        onViewLeaderboard={() => setScreen('leaderboard')}
      />
    )
  }

  if (screen === 'game') {
    return (
      <GameScreen
        cars={cars}
        themeName={session.theme_name}
        onComplete={handleComplete}
        onQuit={() => setScreen('intro')}
      />
    )
  }

  if (screen === 'leaderboard') {
    return (
      <LeaderboardScreen
        sessionDate={session.date}
        themeName={session.theme_name}
        onBack={() => setScreen('intro')}
      />
    )
  }

  const totalScore = results.reduce((sum, r) => sum + r.score, 0)

  const resultsProps = {
    results,
    cars,
    nickname,
    themeName: session.theme_name,
    sessionDate: session.date,
    totalScore,
  }

  return communityEnabled ? (
    <ResultsScreenV2 {...resultsProps} />
  ) : (
    <ResultsScreen {...resultsProps} />
  )
}
