const STORAGE_KEY = 'bernie_device_id'

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const fresh = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    return crypto.randomUUID()
  }
}
