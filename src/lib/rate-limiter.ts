/**
 * In-Memory Rate Limiter
 *
 * A sliding window rate limiter implementation for API protection.
 * NOTE: This is suitable for single-instance deployments. For production
 * with multiple instances, use Redis-based rate limiting.
 *
 * Features:
 * - Sliding window algorithm for smooth rate limiting
 * - Configurable limits per endpoint/action
 * - Automatic cleanup of expired entries
 * - IP and user-based limiting
 */

import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  windowStart: number
  requests: number[] // Timestamps of individual requests for sliding window
}

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyPrefix?: string // Optional prefix for the key
}

// In-memory store for rate limit data
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup interval (5 minutes)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000

// Last cleanup timestamp
let lastCleanup = Date.now()

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now()

  // Only cleanup every 5 minutes
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return

  lastCleanup = now

  for (const [key, entry] of rateLimitStore.entries()) {
    // Remove entries that haven't been updated in the last hour
    if (now - entry.windowStart > 60 * 60 * 1000) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Check rate limit for a given key
 * @param key - Unique identifier (IP, userId, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining count
 */
export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now()
  const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key

  // Periodic cleanup
  cleanupExpiredEntries()

  let entry = rateLimitStore.get(fullKey)

  if (!entry) {
    // First request - create new entry
    entry = {
      count: 1,
      windowStart: now,
      requests: [now],
    }
    rateLimitStore.set(fullKey, entry)
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetMs: config.windowMs,
    }
  }

  // Filter requests within the current window (sliding window)
  const windowStart = now - config.windowMs
  entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart)

  // Check if limit exceeded
  if (entry.requests.length >= config.maxRequests) {
    const oldestRequest = entry.requests[0]
    const resetMs = oldestRequest + config.windowMs - now
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, resetMs),
    }
  }

  // Add new request
  entry.requests.push(now)
  entry.count = entry.requests.length
  entry.windowStart = now

  return {
    allowed: true,
    remaining: config.maxRequests - entry.requests.length,
    resetMs: config.windowMs,
  }
}

/**
 * Rate limit response with appropriate headers
 */
export function rateLimitResponse(
  remaining: number,
  resetMs: number,
  message: string = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
): NextResponse {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(resetMs / 1000).toString(),
        'Retry-After': Math.ceil(resetMs / 1000).toString(),
      },
    }
  )
}

/**
 * Add rate limit headers to response
 */
export function addRateLimitHeaders(
  response: NextResponse,
  remaining: number,
  limit: number,
  resetMs: number
): NextResponse {
  response.headers.set('X-RateLimit-Limit', limit.toString())
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', Math.ceil(resetMs / 1000).toString())
  return response
}

// ============ Preset Configurations ============

export const RATE_LIMIT_CONFIGS = {
  // Public read endpoints - generous limits
  PUBLIC_READ: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
    keyPrefix: 'public',
  },

  // Authenticated read endpoints
  AUTHENTICATED_READ: {
    windowMs: 60 * 1000,
    maxRequests: 120, // 120 requests per minute
    keyPrefix: 'auth-read',
  },

  // Write endpoints (create, update, delete)
  AUTHENTICATED_WRITE: {
    windowMs: 60 * 1000,
    maxRequests: 30, // 30 writes per minute
    keyPrefix: 'auth-write',
  },

  // Sensitive operations (password reset, etc.)
  SENSITIVE: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5, // 5 per hour
    keyPrefix: 'sensitive',
  },

  // File upload
  UPLOAD: {
    windowMs: 60 * 1000,
    maxRequests: 10, // 10 uploads per minute
    keyPrefix: 'upload',
  },

  // AI generation (already has its own limits, this is an additional layer)
  AI_GENERATE: {
    windowMs: 60 * 1000,
    maxRequests: 5, // 5 per minute
    keyPrefix: 'ai',
  },
} as const

/**
 * Extract client identifier from request
 * Uses IP address with fallback to headers
 */
export function getClientIdentifier(request: Request): string {
  // Try X-Forwarded-For header (common for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  // Try X-Real-IP header
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a hash of user-agent + accept-language for some uniqueness
  const ua = request.headers.get('user-agent') || ''
  const lang = request.headers.get('accept-language') || ''
  return `anon:${hashCode(ua + lang)}`
}

/**
 * Simple hash function for strings
 */
function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

/**
 * Create a rate limit key combining user ID and IP
 * This prevents both per-user and per-IP abuse
 */
export function createRateLimitKey(userId: string | null, clientIp: string): string {
  if (userId) {
    return `user:${userId}:${clientIp}`
  }
  return `ip:${clientIp}`
}
