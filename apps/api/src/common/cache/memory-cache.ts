/**
 * Simple in-memory TTL cache for hot-path data.
 * Suitable for single-instance deployments; use Redis for multi-instance.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export class MemoryCache {
  private store = new Map<string, CacheEntry<unknown>>()
  private readonly defaultTtlMs: number

  constructor(defaultTtlMs = 60_000) {
    this.defaultTtlMs = defaultTtlMs
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key)
    if (!entry) return undefined
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return undefined
    }
    return entry.value as T
  }

  set<T>(key: string, value: T, ttlMs?: number): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    })
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  invalidatePrefix(prefix: string): void {
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key)
      }
    }
  }

  clear(): void {
    this.store.clear()
  }
}
