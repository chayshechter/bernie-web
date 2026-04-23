import type { ScoreTier } from '../../types/community'
import CredentialBadge from './CredentialBadge'

interface CommentCardProps {
  avatar?: string
  username?: string
  scoreTier?: ScoreTier
  streak?: number
  body?: string
  timestamp?: string
  likeCount?: number
  liked?: boolean
  replyCount?: number
  isSelf?: boolean
  canInteract?: boolean
  onLike?: () => void
  onReply?: () => void
}

export default function CommentCard({
  avatar = 'BF',
  username = 'bernie_fan',
  scoreTier = 'strong',
  streak = 3,
  body = 'Called it at $36k — the mileage bumped me higher than I wanted to go but you can tell the owner cared.',
  timestamp = '2h',
  likeCount = 4,
  liked = false,
  replyCount = 1,
  isSelf = false,
  canInteract = true,
  onLike,
  onReply,
}: CommentCardProps) {
  const wrapperBase = 'px-4 py-3 flex gap-3'
  const wrapperLook = isSelf
    ? 'bg-surface-1 border-l-[3px] border-l-brand rounded-r-xl'
    : 'bg-surface-1 border border-default rounded-xl'

  return (
    <div className={`${wrapperBase} ${wrapperLook}`}>
      <div
        className="shrink-0 w-9 h-9 rounded-full bg-base border border-default flex items-center justify-center text-muted text-xs font-bold"
        aria-hidden
      >
        {avatar}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <CredentialBadge username={username} scoreTier={scoreTier} streak={streak} />
          <span className="text-faint text-xs shrink-0">{timestamp}</span>
        </div>

        <p className="text-body text-sm leading-relaxed mb-2">{body}</p>

        <div className="flex items-center gap-4 text-xs">
          <button
            onClick={onLike}
            disabled={!canInteract}
            className={`inline-flex items-center gap-1 font-semibold transition-colors disabled:opacity-40 ${
              liked ? 'text-brand' : 'text-muted hover:text-white'
            }`}
          >
            <span aria-hidden>{liked ? '♥' : '♡'}</span>
            {likeCount}
          </button>
          <button
            onClick={onReply}
            disabled={!canInteract}
            className="inline-flex items-center gap-1 text-muted hover:text-white font-semibold transition-colors disabled:opacity-40"
          >
            <span aria-hidden>↩</span>
            {replyCount > 0 ? `${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}` : 'Reply'}
          </button>
        </div>
      </div>
    </div>
  )
}
