interface VoteBarProps {
  wouldPct?: number
  wouldntPct?: number
  totalVotes?: number
  userVote?: 'would' | 'wouldnt' | null
  onVote?: (vote: 'would' | 'wouldnt') => void
}

export default function VoteBar({
  wouldPct = 65,
  wouldntPct = 35,
  totalVotes = 128,
  userVote = null,
  onVote,
}: VoteBarProps) {
  if (userVote === null) {
    return (
      <div>
        <p className="text-muted text-[10px] uppercase tracking-widest mb-2 text-center">
          Would you buy it?
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onVote?.('would')}
            className="bg-surface-1 border border-default hover:border-success text-white font-bold text-sm py-3 rounded-xl transition-colors"
          >
            Would
          </button>
          <button
            onClick={() => onVote?.('wouldnt')}
            className="bg-surface-1 border border-default hover:border-brand text-white font-bold text-sm py-3 rounded-xl transition-colors"
          >
            Wouldn&apos;t
          </button>
        </div>
      </div>
    )
  }

  const wouldChosen = userVote === 'would'

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 text-[10px] uppercase tracking-widest">
        <span className={wouldChosen ? 'text-success font-bold' : 'text-muted'}>
          Would · {wouldPct}%
        </span>
        <span className={!wouldChosen ? 'text-brand font-bold' : 'text-muted'}>
          {wouldntPct}% · Wouldn&apos;t
        </span>
      </div>
      <div className="relative h-2 rounded-full bg-surface-1 overflow-hidden flex">
        <div
          className="bg-success h-full transition-all"
          style={{ width: `${wouldPct}%` }}
        />
        <div
          className="bg-brand h-full transition-all"
          style={{ width: `${wouldntPct}%` }}
        />
      </div>
      <p className="text-faint text-[10px] uppercase tracking-widest mt-1.5 text-center">
        {totalVotes.toLocaleString()} votes
      </p>
    </div>
  )
}
