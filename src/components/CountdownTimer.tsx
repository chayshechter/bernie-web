import { useState, useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react'

const TIMER_SECONDS = 60

export interface CountdownTimerHandle {
  reset: () => void
  stop: () => void
  getTimeLeft: () => number
}

interface CountdownTimerProps {
  onExpire: () => void
  revealed: boolean
}

const CountdownTimer = forwardRef<CountdownTimerHandle, CountdownTimerProps>(
  ({ onExpire, revealed }, ref) => {
    const [display, setDisplay] = useState(TIMER_SECONDS)
    const startTimeRef = useRef(Date.now())
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const expiredRef = useRef(false)
    const stoppedRef = useRef(false)

    const getRemaining = useCallback(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000
      return Math.max(0, Math.ceil(TIMER_SECONDS - elapsed))
    }, [])

    function stopTimer() {
      stoppedRef.current = true
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    function startTimer() {
      stopTimer()
      stoppedRef.current = false
      expiredRef.current = false
      startTimeRef.current = Date.now()
      setDisplay(TIMER_SECONDS)
      intervalRef.current = setInterval(() => {
        if (stoppedRef.current) return
        const remaining = getRemaining()
        setDisplay(remaining)
        if (remaining <= 0 && !expiredRef.current) {
          expiredRef.current = true
          stopTimer()
          onExpire()
        }
      }, 250) // Tick 4x/sec for snappy display, uses wall clock
    }

    // Handle tab visibility changes — check wall clock on return
    useEffect(() => {
      function handleVisibility() {
        if (document.visibilityState === 'visible' && !stoppedRef.current && !expiredRef.current) {
          const remaining = getRemaining()
          setDisplay(remaining)
          if (remaining <= 0) {
            expiredRef.current = true
            stopTimer()
            onExpire()
          }
        }
      }
      document.addEventListener('visibilitychange', handleVisibility)
      return () => document.removeEventListener('visibilitychange', handleVisibility)
    }, [getRemaining, onExpire])

    useImperativeHandle(ref, () => ({
      reset: startTimer,
      stop: stopTimer,
      getTimeLeft: getRemaining,
    }))

    useEffect(() => {
      startTimer()
      return stopTimer
    }, [])

    const urgent = display <= 10 && !revealed

    return (
      <span
        className={`font-mono font-black text-2xl tabular-nums ${
          revealed
            ? 'text-[#484f58]'
            : urgent
              ? 'text-orange-400'
              : 'text-white'
        }`}
      >
        {revealed ? ':--' : `:${String(display).padStart(2, '0')}`}
      </span>
    )
  }
)

CountdownTimer.displayName = 'CountdownTimer'

export default CountdownTimer
