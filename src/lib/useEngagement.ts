import { useCallback, useEffect, useRef, useState } from 'react'
import { getDeviceId } from './deviceId'
import {
  getCarEngagement,
  voteOnCar,
  reactOnCar,
  type CarEngagement,
} from './supabase-community'
import type { ReactionKind } from '../types/community'

type Vote = 'would' | 'wouldnt'

const EMPTY: CarEngagement = {
  votes: { would: 0, wouldnt: 0 },
  reactions: { fire: 0, skull: 0, heart_eyes: 0, thinking: 0 },
  userVote: null,
  userReaction: null,
}

export interface UseCarEngagement extends CarEngagement {
  loading: boolean
  /** Cast/replace this device's vote. Optimistic; reverts on failure. */
  vote: (v: Vote) => void
  /** Toggle/swap this device's reaction (one per car). Optimistic. */
  react: (r: ReactionKind) => void
}

/**
 * Loads vote + reaction state for a car and exposes optimistic `vote`/`react`
 * actions. Anonymous players are scoped by the localStorage device_id from
 * getDeviceId(); persistence + uniqueness are handled by the
 * supabase-community helpers.
 */
export function useCarEngagement(carId: string): UseCarEngagement {
  const deviceId = getDeviceId()
  const [data, setData] = useState<CarEngagement>(EMPTY)
  const [loading, setLoading] = useState(true)
  // Mirrors `data` so action handlers can snapshot for rollback without a
  // stale closure, and so a slow initial fetch can't clobber an optimistic
  // action the user already took.
  const dataRef = useRef<CarEngagement>(EMPTY)
  const touched = useRef(false)

  const apply = useCallback((next: CarEngagement) => {
    dataRef.current = next
    setData(next)
  }, [])

  useEffect(() => {
    let cancelled = false
    touched.current = false
    // `loading` starts true from useState; CarFeedCard is keyed by car.id so a
    // mounted instance never changes carId, hence no synchronous reset here.
    getCarEngagement(carId, deviceId)
      .then((res) => {
        if (!cancelled && !touched.current) {
          dataRef.current = res
          setData(res)
        }
      })
      .catch((err) => console.error('[bernie] getCarEngagement failed:', err))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [carId, deviceId])

  const vote = useCallback(
    (v: Vote) => {
      touched.current = true
      const snapshot = dataRef.current
      if (snapshot.userVote === v) return

      const votes = { ...snapshot.votes }
      if (snapshot.userVote === 'would') votes.would = Math.max(0, votes.would - 1)
      if (snapshot.userVote === 'wouldnt')
        votes.wouldnt = Math.max(0, votes.wouldnt - 1)
      votes[v] += 1
      apply({ ...snapshot, votes, userVote: v })

      voteOnCar(carId, v, deviceId).catch((err) => {
        console.error('[bernie] voteOnCar failed:', err)
        apply(snapshot)
      })
    },
    [carId, deviceId, apply],
  )

  const react = useCallback(
    (r: ReactionKind) => {
      touched.current = true
      const snapshot = dataRef.current
      const prev = snapshot.userReaction
      const reactions = { ...snapshot.reactions }

      if (prev === r) {
        // Tapping the active reaction clears it.
        reactions[r] = Math.max(0, reactions[r] - 1)
        apply({ ...snapshot, reactions, userReaction: null })
      } else {
        if (prev) reactions[prev] = Math.max(0, reactions[prev] - 1)
        reactions[r] += 1
        apply({ ...snapshot, reactions, userReaction: r })
      }

      // v1 supabase-community has no "remove reaction" helper, so a toggle-off
      // still writes the reaction server-side; the visible count is corrected
      // locally and reconciles on next load. Net effect for one-per-car is
      // acceptable for v1.
      reactOnCar(carId, r, deviceId).catch((err) => {
        console.error('[bernie] reactOnCar failed:', err)
        apply(snapshot)
      })
    },
    [carId, deviceId, apply],
  )

  return { ...data, loading, vote, react }
}
