const TZ = 'America/New_York'

function formatEastern(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getTodayEastern(): string {
  return formatEastern(new Date())
}

/** Returns ISO timestamp for midnight today in Eastern time (for created_at filtering) */
export function getTodayStartEastern(): string {
  // Build a proper offset-aware timestamp for midnight Eastern
  const todayStr = getTodayEastern()
  const offset = getEasternOffset()
  return todayStr + 'T00:00:00' + offset
}

export function getTomorrowEastern(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatEastern(d)
}

export function getYesterdayEastern(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatEastern(d)
}

/** Returns weekly bounds for the current week in Eastern time */
export function getEasternWeekBounds(): { start: string; end: string } {
  const todayEastern = getTodayEastern()

  // Special case: launch week starts on Saturday April 4
  if (todayEastern <= '2026-04-12') {
    return { start: '2026-04-04', end: '2026-04-12' }
  }

  // Normal behavior: Sunday–Saturday bounds
  const now = new Date()
  const easternStr = formatEastern(now)
  const [y, m, d] = easternStr.split('-').map(Number)

  const easternDate = new Date(y, m - 1, d)
  const dayOfWeek = easternDate.getDay() // 0 = Sunday

  const sunday = new Date(easternDate)
  sunday.setDate(easternDate.getDate() - dayOfWeek)

  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  return {
    start: formatEastern(sunday),
    end: formatEastern(saturday),
  }
}

/** Returns milliseconds until midnight Eastern */
export function getMsUntilMidnightEastern(): number {
  const now = new Date()
  const easternTime = new Date(now.toLocaleString('en-US', { timeZone: TZ }))
  const midnight = new Date(easternTime)
  midnight.setDate(midnight.getDate() + 1)
  midnight.setHours(0, 0, 0, 0)
  return midnight.getTime() - easternTime.getTime()
}

/** Format milliseconds as HH:MM:SS countdown */
export function formatCountdown(ms: number): string {
  const totalSec = Math.floor(ms / 1000)
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/** Get current Eastern UTC offset string (e.g. "-04:00" or "-05:00") */
function getEasternOffset(): string {
  const now = new Date()
  // Get offset by comparing UTC and Eastern representations
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }))
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: TZ }))
  const diffMin = (eastern.getTime() - utc.getTime()) / 60000
  const sign = diffMin >= 0 ? '+' : '-'
  const absMin = Math.abs(diffMin)
  const hh = String(Math.floor(absMin / 60)).padStart(2, '0')
  const mm = String(absMin % 60).padStart(2, '0')
  return `${sign}${hh}:${mm}`
}

// Backward-compatible aliases
export const getTodayIsrael = getTodayEastern
export const getTodayStartIsrael = getTodayStartEastern
export const getTomorrowIsrael = getTomorrowEastern
export const getYesterdayIsrael = getYesterdayEastern
export const getIsraelWeekBounds = getEasternWeekBounds
