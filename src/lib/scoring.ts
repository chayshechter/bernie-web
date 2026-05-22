export function parseSoldPrice(raw: string | number): number {
  if (typeof raw === 'number') return raw
  return parseInt(String(raw).replace(/[^0-9]/g, ''), 10) || 0
}

// Minimum possible score — wild guesses bottom out here instead of at 0.
const SCORE_FLOOR = 3
// Hard split: cars priced at or above this use the percentage-off formula.
const CHEAP_THRESHOLD = 25000

// Anchor points for the cheap-car curve: [dollarsOff, score].
// Piecewise-linear interpolation between these passes through each anchor
// exactly while staying continuous and monotonic (bigger miss = lower score).
const CHEAP_ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [0, 100],
  [1000, 92],
  [2500, 82],
  [5000, 70],
  [7500, 60],
  [10000, 52],
  [15000, 30],
  [20000, 12],
  [25000, 4],
]

// Round to an integer and clamp into the valid [SCORE_FLOOR, 100] range.
function clampScore(score: number): number {
  return Math.min(100, Math.max(SCORE_FLOOR, Math.round(score)))
}

// Score a cheap-car guess from the absolute dollar miss, interpolating
// linearly between the anchor points above.
function cheapCarScore(dollarsOff: number): number {
  const last = CHEAP_ANCHORS[CHEAP_ANCHORS.length - 1]
  // At or beyond the final anchor ($25k off), flatten to the floor.
  if (dollarsOff >= last[0]) return clampScore(last[1])

  for (let i = 1; i < CHEAP_ANCHORS.length; i++) {
    const [prevOff, prevScore] = CHEAP_ANCHORS[i - 1]
    const [nextOff, nextScore] = CHEAP_ANCHORS[i]
    if (dollarsOff <= nextOff) {
      const t = (dollarsOff - prevOff) / (nextOff - prevOff)
      return clampScore(prevScore + t * (nextScore - prevScore))
    }
  }
  return clampScore(last[1])
}

export function calculateScore(guess: number, actual: number): number {
  // Guard against divide-by-zero and nonsensical input.
  if (actual <= 0) return SCORE_FLOOR

  const dollarsOff = Math.abs(guess - actual)

  if (actual >= CHEAP_THRESHOLD) {
    // Expensive cars: original percentage-off formula, now with a floor so
    // a wild guess scores SCORE_FLOOR instead of 0.
    const pctOff = Math.round((dollarsOff / actual) * 100)
    return clampScore(100 - pctOff)
  }

  // Cheap cars: players think in dollars, so score the absolute miss.
  return cheapCarScore(dollarsOff)
}

export function getScoreEmoji(score: number): string {
  if (score >= 80) return '🟩'
  if (score >= 60) return '🟨'
  if (score >= 40) return '🟧'
  return '🟥'
}

export function guessesToEmojiGrid(guesses: { score: number }[]): string {
  return guesses.map((g) => getScoreEmoji(g.score)).join('')
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price)
}

export function generateShareText(
  themeName: string,
  date: string,
  scores: number[],
  totalScore: number
): string {
  const emojiGrid = scores.map((s) => getScoreEmoji(s)).join('')
  return `🏎️ Bernie Daily — ${themeName}\n📅 ${date}\n\n${emojiGrid}\n\n🏆 ${totalScore}/1000\n\nCan you beat me? → https://berniedaily.com`
}
