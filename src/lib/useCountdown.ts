import { useEffect, useState } from 'react'
import { getMsUntilMidnightEastern } from './date'

export interface Countdown {
  hours: number
  minutes: number
  seconds: number
  /** Zero-padded "HH:MM:SS". */
  formatted: string
}

function compute(targetDate?: Date): Countdown {
  const ms = targetDate
    ? targetDate.getTime() - Date.now()
    : getMsUntilMidnightEastern()
  const totalSec = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSec / 3600)
  const minutes = Math.floor((totalSec % 3600) / 60)
  const seconds = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    hours,
    minutes,
    seconds,
    formatted: `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`,
  }
}

/**
 * Live countdown, re-rendering every second.
 *
 * Pass an explicit `targetDate` to count down to it; omit it to count down to
 * the next midnight in America/New_York (the daily-set rollover), which is the
 * default used by the results screen.
 */
export function useCountdown(targetDate?: Date): Countdown {
  const [state, setState] = useState<Countdown>(() => compute(targetDate))

  useEffect(() => {
    // Tick once a second; the useState initializer already seeded the first
    // value, and a targetDate change reconciles within one tick.
    const id = setInterval(() => setState(compute(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  return state
}
