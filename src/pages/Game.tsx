import { useState, useEffect } from 'react'
import type { Car, DailySession, GuessResult } from '../lib/types'
import { supabase } from '../lib/supabase'
import { getTodayIsrael } from '../lib/date'
import IntroScreen from '../components/IntroScreen'
import GameScreen from '../components/GameScreen'
import ResultsScreen from '../components/ResultsScreen'
import LeaderboardScreen from '../components/LeaderboardScreen'

type Screen = 'loading' | 'intro' | 'game' | 'results' | 'leaderboard'

export default function Game() {
  const [screen, setScreen] = useState<Screen>('loading')
  const [session, setSession] = useState<DailySession | null>(null)
  const [cars, setCars] = useState<Car[]>([])
  const [results, setResults] = useState<GuessResult[]>([])
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string | null>(null)

  const streak = parseInt(localStorage.getItem('bernie_streak') || '0')

  useEffect(() => {
    loadTodaysSession()
  }, [])

  async function loadTodaysSession() {
    const today = getTodayIsrael()

    const { data: sessionData, error: sessionError } = await supabase
      .from('daily_sessions')
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

  return (
    <ResultsScreen
      results={results}
      cars={cars}
      nickname={nickname}
      themeName={session.theme_name}
      sessionDate={session.date}
      totalScore={totalScore}
    />
  )
}
