export function parseSoldPrice(raw: string | number): number {
  if (typeof raw === 'number') return raw
  return parseInt(String(raw).replace(/[^0-9]/g, ''), 10) || 0
}

export function calculateScore(guess: number, actual: number): number {
  return 100 - Math.min(100, Math.round((Math.abs(guess - actual) / actual) * 100))
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
  return `🏎️ Bernie Daily — ${themeName}\n📅 ${date}\n\n${emojiGrid}\n\n🏆 ${totalScore}/1000\n\nCan you beat me? → https://bernie-web.vercel.app`
}
