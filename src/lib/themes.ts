const THEME_EMOJI: Record<string, string> = {
  'Legends of the Road': '🏆',
  'Autobahn': '🇩🇪',
}

export function getThemeEmoji(themeName: string): string {
  return THEME_EMOJI[themeName] ?? ''
}

export function themeWithEmoji(themeName: string): string {
  const emoji = getThemeEmoji(themeName)
  return emoji ? `${emoji} ${themeName}` : themeName
}
