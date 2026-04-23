import type { ScoreTier } from '../../types/community'
import StatsStrip from './StatsStrip'
import VoteBar from './VoteBar'
import CredentialBadge from './CredentialBadge'

interface CarSpecs {
  engine?: string
  mileage?: string
  transmission?: string
}

interface CarCardCar {
  id?: string
  year?: number
  make?: string
  model?: string
  heroImageUrl?: string | null
  specs?: CarSpecs
}

interface CarCardUserResult {
  yourGuess: number
  soldFor: number
  points: number
}

interface CarCardTopComment {
  username: string
  scoreTier: ScoreTier
  streak: number
  body: string
}

interface CarCardProps {
  car?: CarCardCar
  userResult?: CarCardUserResult
  votes?: {
    wouldPct: number
    wouldntPct: number
    totalVotes: number
    userVote: 'would' | 'wouldnt' | null
  }
  topComment?: CarCardTopComment | null
  commentCount?: number
  onOpenComments?: () => void
  onVote?: (vote: 'would' | 'wouldnt') => void
}

const DEFAULT_CAR: CarCardCar = {
  id: 'placeholder',
  year: 1996,
  make: 'Porsche',
  model: '911 Turbo',
  heroImageUrl: null,
  specs: {
    engine: 'Twin-Turbo 3.6L Flat-Six',
    mileage: '67k Miles',
    transmission: '6-Speed Manual',
  },
}

const DEFAULT_RESULT: CarCardUserResult = {
  yourGuess: 35000,
  soldFor: 37000,
  points: 94,
}

const DEFAULT_VOTES = {
  wouldPct: 65,
  wouldntPct: 35,
  totalVotes: 128,
  userVote: null as 'would' | 'wouldnt' | null,
}

const DEFAULT_TOP_COMMENT: CarCardTopComment = {
  username: 'sheffdog',
  scoreTier: 'perfect',
  streak: 9,
  body: 'Nailed it. Documented history on these makes all the difference — reserve was always going to be met.',
}

export default function CarCard({
  car = DEFAULT_CAR,
  userResult = DEFAULT_RESULT,
  votes = DEFAULT_VOTES,
  topComment = DEFAULT_TOP_COMMENT,
  commentCount = 12,
  onOpenComments,
  onVote,
}: CarCardProps) {
  const specs = car.specs ?? {}
  const hasSpecs = specs.engine || specs.mileage || specs.transmission

  return (
    <div className="bg-surface-1 border border-default rounded-2xl overflow-hidden">
      <div
        className="w-full bg-[#111] flex items-center justify-center"
        style={{ aspectRatio: '16 / 9' }}
      >
        {car.heroImageUrl ? (
          <img
            src={car.heroImageUrl}
            alt={`${car.year} ${car.make} ${car.model}`}
            className="w-full h-full object-cover"
            draggable={false}
          />
        ) : (
          <span className="text-faint text-xs uppercase tracking-widest">Car photo</span>
        )}
      </div>

      <div className="px-4 pt-4 pb-5 space-y-4">
        <h3 className="text-white text-lg font-bold text-center">
          {car.year} {car.make} {car.model}
        </h3>

        {hasSpecs && (
          <div className="grid grid-cols-3 gap-2">
            {specs.engine && (
              <div className="bg-base rounded-xl px-2 py-2 text-center">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Engine</p>
                <p className="text-white text-xs font-semibold">{specs.engine}</p>
              </div>
            )}
            {specs.mileage && (
              <div className="bg-base rounded-xl px-2 py-2 text-center">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Mileage</p>
                <p className="text-white text-xs font-semibold">{specs.mileage}</p>
              </div>
            )}
            {specs.transmission && (
              <div className="bg-base rounded-xl px-2 py-2 text-center">
                <p className="text-muted text-[10px] uppercase tracking-wider mb-0.5">Transmission</p>
                <p className="text-white text-xs font-semibold">{specs.transmission}</p>
              </div>
            )}
          </div>
        )}

        <StatsStrip
          yourGuess={userResult.yourGuess}
          soldFor={userResult.soldFor}
          points={userResult.points}
        />

        <VoteBar
          wouldPct={votes.wouldPct}
          wouldntPct={votes.wouldntPct}
          totalVotes={votes.totalVotes}
          userVote={votes.userVote}
          onVote={onVote}
        />

        {topComment && (
          <div className="bg-base rounded-xl px-3 py-3">
            <p className="text-faint text-[10px] uppercase tracking-widest mb-2">Top Comment</p>
            <div className="mb-1">
              <CredentialBadge
                username={topComment.username}
                scoreTier={topComment.scoreTier}
                streak={topComment.streak}
              />
            </div>
            <p className="text-body text-sm leading-relaxed line-clamp-2">
              {topComment.body}
            </p>
          </div>
        )}

        <button
          onClick={onOpenComments}
          className="w-full bg-surface-1 border border-default hover:border-hover text-muted hover:text-white font-semibold text-sm py-3 rounded-xl transition-colors"
        >
          {commentCount > 0
            ? `View ${commentCount} ${commentCount === 1 ? 'comment' : 'comments'} →`
            : 'Start the discussion →'}
        </button>
      </div>
    </div>
  )
}
