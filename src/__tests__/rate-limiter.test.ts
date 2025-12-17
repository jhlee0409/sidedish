import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitKey,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Reset timers and clear any state between tests
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow first request', () => {
      const result = checkRateLimit('test-key-1', {
        windowMs: 60000,
        maxRequests: 10,
      })

      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should allow requests up to the limit', () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const key = 'test-key-2'

      // First 5 requests should be allowed
      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(key, config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests after limit exceeded', () => {
      const config = { windowMs: 60000, maxRequests: 3 }
      const key = 'test-key-3'

      // Use up all requests
      for (let i = 0; i < 3; i++) {
        checkRateLimit(key, config)
      }

      // Next request should be blocked
      const result = checkRateLimit(key, config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires (sliding window)', () => {
      const config = { windowMs: 60000, maxRequests: 2 }
      const key = 'test-key-4'

      // Use up all requests
      checkRateLimit(key, config)
      checkRateLimit(key, config)

      // Should be blocked
      let result = checkRateLimit(key, config)
      expect(result.allowed).toBe(false)

      // Advance time past the window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(1)
    })

    it('should handle sliding window correctly', () => {
      const config = { windowMs: 60000, maxRequests: 3 }
      const key = 'test-key-5'

      // Make 3 requests
      checkRateLimit(key, config)
      vi.advanceTimersByTime(20000)
      checkRateLimit(key, config)
      vi.advanceTimersByTime(20000)
      checkRateLimit(key, config)

      // At t=40s, should be blocked
      let result = checkRateLimit(key, config)
      expect(result.allowed).toBe(false)

      // Advance to t=61s - first request should have expired
      vi.advanceTimersByTime(21000)

      // Should be allowed now (first request expired)
      result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
    })

    it('should use keyPrefix correctly', () => {
      const config1 = { windowMs: 60000, maxRequests: 1, keyPrefix: 'prefix1' }
      const config2 = { windowMs: 60000, maxRequests: 1, keyPrefix: 'prefix2' }
      const key = 'same-key'

      // Both should be allowed as they have different prefixes
      const result1 = checkRateLimit(key, config1)
      const result2 = checkRateLimit(key, config2)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
    })

    it('should calculate resetMs correctly', () => {
      const config = { windowMs: 60000, maxRequests: 1 }
      const key = 'test-key-6'

      // Make first request
      checkRateLimit(key, config)

      // Next request should be blocked with correct reset time
      const result = checkRateLimit(key, config)
      expect(result.allowed).toBe(false)
      expect(result.resetMs).toBeGreaterThan(0)
      expect(result.resetMs).toBeLessThanOrEqual(60000)
    })
  })

  describe('RATE_LIMIT_CONFIGS', () => {
    it('should have correct PUBLIC_READ config', () => {
      expect(RATE_LIMIT_CONFIGS.PUBLIC_READ.windowMs).toBe(60000)
      expect(RATE_LIMIT_CONFIGS.PUBLIC_READ.maxRequests).toBe(60)
    })

    it('should have correct UPLOAD config', () => {
      expect(RATE_LIMIT_CONFIGS.UPLOAD.windowMs).toBe(60000)
      expect(RATE_LIMIT_CONFIGS.UPLOAD.maxRequests).toBe(10)
    })

    it('should have correct AI_GENERATE config', () => {
      expect(RATE_LIMIT_CONFIGS.AI_GENERATE.windowMs).toBe(60000)
      expect(RATE_LIMIT_CONFIGS.AI_GENERATE.maxRequests).toBe(5)
    })

    it('should have correct SENSITIVE config', () => {
      expect(RATE_LIMIT_CONFIGS.SENSITIVE.windowMs).toBe(3600000) // 1 hour
      expect(RATE_LIMIT_CONFIGS.SENSITIVE.maxRequests).toBe(5)
    })
  })

  describe('getClientIdentifier', () => {
    it('should extract IP from x-forwarded-for header', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1, 10.0.0.1',
        },
      })

      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-real-ip': '192.168.1.2',
        },
      })

      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.2')
    })

    it('should prefer x-forwarded-for over x-real-ip', () => {
      const request = new Request('http://example.com', {
        headers: {
          'x-forwarded-for': '192.168.1.1',
          'x-real-ip': '192.168.1.2',
        },
      })

      const result = getClientIdentifier(request)
      expect(result).toBe('192.168.1.1')
    })

    it('should fallback to hash for anonymous users', () => {
      const request = new Request('http://example.com', {
        headers: {
          'user-agent': 'Mozilla/5.0',
          'accept-language': 'en-US',
        },
      })

      const result = getClientIdentifier(request)
      expect(result).toMatch(/^anon:\d+$/)
    })
  })

  describe('createRateLimitKey', () => {
    it('should create user-based key when userId provided', () => {
      const result = createRateLimitKey('user123', '192.168.1.1')
      expect(result).toBe('user:user123:192.168.1.1')
    })

    it('should create IP-based key when userId is null', () => {
      const result = createRateLimitKey(null, '192.168.1.1')
      expect(result).toBe('ip:192.168.1.1')
    })
  })

  describe('Concurrent Request Handling', () => {
    it('should handle rapid concurrent requests correctly', () => {
      const config = { windowMs: 60000, maxRequests: 5 }
      const key = 'concurrent-test'

      // Simulate 10 rapid requests
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(checkRateLimit(key, config))
      }

      // First 5 should be allowed
      expect(results.filter(r => r.allowed).length).toBe(5)
      // Last 5 should be blocked
      expect(results.filter(r => !r.allowed).length).toBe(5)
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero max requests', () => {
      const config = { windowMs: 60000, maxRequests: 0 }

      // First request goes through (creates entry)
      const result1 = checkRateLimit('zero-test', config)
      expect(result1.allowed).toBe(true)
      expect(result1.remaining).toBe(-1) // Negative remaining indicates over limit

      // Second request should be blocked
      const result2 = checkRateLimit('zero-test', config)
      expect(result2.allowed).toBe(false)
    })

    it('should handle very short window', () => {
      const config = { windowMs: 100, maxRequests: 2 }
      const key = 'short-window-test'

      checkRateLimit(key, config)
      checkRateLimit(key, config)

      // Should be blocked
      let result = checkRateLimit(key, config)
      expect(result.allowed).toBe(false)

      // Wait for window to expire
      vi.advanceTimersByTime(150)

      // Should be allowed again
      result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
    })

    it('should handle different keys independently', () => {
      const config = { windowMs: 60000, maxRequests: 1 }

      const result1 = checkRateLimit('key-a', config)
      const result2 = checkRateLimit('key-b', config)
      const result3 = checkRateLimit('key-c', config)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result3.allowed).toBe(true)
    })
  })
})
