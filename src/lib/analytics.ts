declare function gtag(...args: unknown[]): void

export const Analytics = {
  gameStarted: (theme: string) => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'game_started', { theme })
  },
  carLockedIn: (carIndex: number, score: number, timeLeft: number) => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'car_locked_in', { car_index: carIndex, score, time_left: timeLeft })
  },
  gameCompleted: (totalScore: number, theme: string) => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'game_completed', { total_score: totalScore, theme })
  },
  gameQuit: (atCarIndex: number, theme: string) => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'game_quit', { quit_at_car: atCarIndex, theme })
  },
  scoreShared: () => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'score_shared')
  },
  leaderboardViewed: (tab: 'daily' | 'weekly') => {
    if (typeof gtag === 'undefined') return
    gtag('event', 'leaderboard_viewed', { tab })
  },
}
