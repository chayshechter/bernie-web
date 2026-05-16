import { useState } from 'react'

// Community v1 is ON by default. ?community=off is the kill switch and
// persists, so a user who opts out stays out across visits until they
// explicitly opt back in with ?community=on.
const STORAGE_KEY = 'bernie_community'

/**
 * Reads ?community from the current URL and persists it:
 *   ?community=on  → localStorage 'bernie_community' = 'on'
 *   ?community=off → localStorage 'bernie_community' = 'off'  (kill switch)
 * No param leaves any existing stored value untouched.
 * Safe to call at startup; swallows storage errors (private mode, etc).
 */
export function syncCommunityFlagFromUrl(): void {
  try {
    const param = new URLSearchParams(window.location.search).get('community')
    if (param === 'on') localStorage.setItem(STORAGE_KEY, 'on')
    else if (param === 'off') localStorage.setItem(STORAGE_KEY, 'off')
  } catch {
    // ignore — fall back to the default
  }
}

/**
 * Current flag state. Default is ON; only an explicit opt-out disables it.
 *   - URL ?community=on  → true
 *   - URL ?community=off → false
 *   - stored 'off'       → false
 *   - stored 'on'        → true
 *   - neither set         → true (default ON)
 */
export function isCommunityEnabled(): boolean {
  try {
    const param = new URLSearchParams(window.location.search).get('community')
    if (param === 'on') return true
    if (param === 'off') return false
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/**
 * Hook form. Resolves once on mount (also persisting any URL param) and stays
 * stable for the lifetime of the component — we don't want the results screen
 * swapping out from under the user mid-session.
 */
export function useCommunityEnabled(): boolean {
  const [enabled] = useState(() => {
    syncCommunityFlagFromUrl()
    return isCommunityEnabled()
  })
  return enabled
}
