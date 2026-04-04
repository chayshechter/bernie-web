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

/** Returns Sunday–Saturday bounds for the current week in Israel time */
export function getIsraelWeekBounds(): { start: string; end: string } {
  // Get current Israel date parts
  const now = new Date()
  const israelStr = formatIsrael(now)
  const [y, m, d] = israelStr.split('-').map(Number)

  // Create a date in local time that matches the Israel date
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
