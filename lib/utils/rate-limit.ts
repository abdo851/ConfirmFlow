export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

interface RateLimitEntry {
  timestamps: number[];
}

const rateLimitStore = new Map<string, RateLimitEntry>();

function pruneExpiredTimestamps(
  timestamps: number[],
  windowStart: number,
): number[] {
  return timestamps.filter((timestamp) => timestamp > windowStart);
}

/**
 * Generic in-memory sliding-window rate limiter.
 * Suitable for single-process development; use an external store in production.
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  if (limit <= 0 || windowMs <= 0) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: now + windowMs,
    };
  }

  const windowStart = now - windowMs;
  const existing = rateLimitStore.get(key);
  const activeTimestamps = pruneExpiredTimestamps(
    existing?.timestamps ?? [],
    windowStart,
  );

  if (activeTimestamps.length >= limit) {
    const oldestTimestamp = activeTimestamps[0] ?? now;
    return {
      allowed: false,
      remaining: 0,
      resetAt: oldestTimestamp + windowMs,
    };
  }

  activeTimestamps.push(now);
  rateLimitStore.set(key, { timestamps: activeTimestamps });

  return {
    allowed: true,
    remaining: Math.max(limit - activeTimestamps.length, 0),
    resetAt: now + windowMs,
  };
}

/**
 * Removes expired entries from the in-memory rate limit store.
 */
export function cleanupRateLimitStore(now = Date.now(), maxWindowMs = 60_000): number {
  let removed = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    const windowStart = now - maxWindowMs;
    const activeTimestamps = pruneExpiredTimestamps(entry.timestamps, windowStart);

    if (activeTimestamps.length === 0) {
      rateLimitStore.delete(key);
      removed += 1;
      continue;
    }

    if (activeTimestamps.length !== entry.timestamps.length) {
      rateLimitStore.set(key, { timestamps: activeTimestamps });
    }
  }

  return removed;
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}
