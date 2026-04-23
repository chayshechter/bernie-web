interface StatsStripProps {
  yourGuess?: number
  soldFor?: number
  points?: number
}

function formatPrice(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n)
}

function pointsColor(points: number): string {
  if (points >= 80) return 'text-success'
  if (points >= 40) return 'text-warn'
  return 'text-brand'
}

export default function StatsStrip({
  yourGuess = 35000,
  soldFor = 37000,
  points = 94,
}: StatsStripProps) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <div className="bg-base rounded-xl px-3 py-3 text-center">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Your Guess</p>
        <p className="text-white text-base font-bold">{formatPrice(yourGuess)}</p>
      </div>
      <div className="bg-base rounded-xl px-3 py-3 text-center">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Sold For</p>
        <p className="text-white text-base font-bold">{formatPrice(soldFor)}</p>
      </div>
      <div className="bg-base rounded-xl px-3 py-3 text-center">
        <p className="text-muted text-[10px] uppercase tracking-wider mb-1">Points</p>
        <p className={`text-base font-bold ${pointsColor(points)}`}>{points}</p>
      </div>
    </div>
  )
}
