import type { NextRequest } from 'next/server'

interface RateLimitStore {
  count: number
  resetAt: number
}

const stores = new Map<string, Map<string, RateLimitStore>>()

export interface RateLimitOptions {
  /** Unique key for this limiter (e.g. 'company-info') */
  id: string
  /** Max requests per window */
  max: number
  /** Window length in milliseconds */
  windowMs: number
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('cf-connecting-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

/**
 * Returns true if the request is within the rate limit, false if it should be rejected.
 * Keyed by (limiter id, client IP).
 */
export function checkRateLimit(req: NextRequest, opts: RateLimitOptions): boolean {
  const ip = getClientIp(req)
  const now = Date.now()

  if (!stores.has(opts.id)) stores.set(opts.id, new Map())
  const store = stores.get(opts.id)!

  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + opts.windowMs })
    return true
  }
  if (entry.count >= opts.max) return false
  entry.count++
  return true
}
