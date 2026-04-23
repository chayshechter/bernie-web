import type { ScoreTier } from '../../types/community'
import ScoreBadge from './ScoreBadge'

interface CredentialBadgeProps {
  username?: string
  scoreTier?: ScoreTier
  streak?: number
}

export default function CredentialBadge({
  username = 'bernie_fan',
  scoreTier = 'strong',
  streak = 3,
}: CredentialBadgeProps) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-white text-sm font-bold">{username}</span>
      <ScoreBadge tier={scoreTier} />
      {streak > 0 && (
        <span className="inline-flex items-center gap-0.5 text-streak text-xs font-bold">
          <span aria-hidden>🔥</span>
          {streak}
        </span>
      )}
    </span>
  )
}
