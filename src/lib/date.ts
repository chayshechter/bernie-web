function formatIsrael(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jerusalem',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getTodayIsrael(): string {
  return formatIsrael(new Date())
}

/** Returns ISO timestamp for midnight today in Israel time (for created_at filtering) */
export function getTodayStartIsrael(): string {
  return getTodayIsrael() + 'T00:00:00+03:00'
}

export function getTomorrowIsrael(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return formatIsrael(d)
}

export function getYesterdayIsrael(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return formatIsrael(d)
}

/** Returns weekly bounds for the current week in Israel time */
export function getIsraelWeekBounds(): { start: string; end: string } {
  const todayIsrael = getTodayIsrael()

  // Special case: launch week starts on Saturday April 4
  if (todayIsrael <= '2026-04-12') {
    return { start: '2026-04-04', end: '2026-04-12' }
  }

  // Normal behavior: Sunday–Saturday bounds
  const now = new Date()
  const israelStr = formatIsrael(now)
  const [y, m, d] = israelStr.split('-').map(Number)

  const israelDate = new Date(y, m - 1, d)
  const dayOfWeek = israelDate.getDay() // 0 = Sunday

  const sunday = new Date(israelDate)
  sunday.setDate(israelDate.getDate() - dayOfWeek)

  const saturday = new Date(sunday)
  saturday.setDate(sunday.getDate() + 6)

  return {
    start: formatIsrael(sunday),
    end: formatIsrael(saturday),
  }
}
