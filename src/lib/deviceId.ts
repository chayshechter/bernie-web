const STORAGE_KEY = 'bernie_device_id'

/**
 * Generate a v4 UUID with a graceful fallback chain:
 *   1. crypto.randomUUID()      — only available in secure contexts
 *                                 (HTTPS or localhost)
 *   2. crypto.getRandomValues() — hand-rolled v4, works in most contexts
 *   3. Math.random()            — last resort. Not cryptographically secure,
 *                                 but a device id only needs to be unique
 *                                 enough, so this is acceptable here.
 *
 * This matters for LAN testing over plain http (e.g. http://10.0.0.12:5173),
 * where crypto.randomUUID is undefined and throws.
 */
function generateUuid(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fall through
  }

  try {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const bytes = new Uint8Array(16)
      crypto.getRandomValues(bytes)
      return uuidFromBytes(bytes)
    }
  } catch {
    // fall through
  }

  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) {
    bytes[i] = Math.floor(Math.random() * 256)
  }
  return uuidFromBytes(bytes)
}

/** Format 16 random bytes as a RFC-4122 v4 UUID string. */
function uuidFromBytes(bytes: Uint8Array): string {
  // Set version (4) and variant (10xx) bits.
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex: string[] = []
  for (let i = 0; i < 256; i++) {
    hex.push((i + 0x100).toString(16).slice(1))
  }
  return (
    hex[bytes[0]] + hex[bytes[1]] + hex[bytes[2]] + hex[bytes[3]] + '-' +
    hex[bytes[4]] + hex[bytes[5]] + '-' +
    hex[bytes[6]] + hex[bytes[7]] + '-' +
    hex[bytes[8]] + hex[bytes[9]] + '-' +
    hex[bytes[10]] + hex[bytes[11]] + hex[bytes[12]] +
    hex[bytes[13]] + hex[bytes[14]] + hex[bytes[15]]
  )
}

export function getDeviceId(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY)
    if (existing) return existing
    const fresh = generateUuid()
    localStorage.setItem(STORAGE_KEY, fresh)
    return fresh
  } catch {
    return generateUuid()
  }
}
