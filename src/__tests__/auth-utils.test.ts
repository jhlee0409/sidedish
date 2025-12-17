import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import {
  unauthorizedResponse,
  forbiddenResponse,
} from '@/lib/auth-utils'

// Mock firebase-admin modules
vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

vi.mock('@/lib/firebase-admin', () => ({
  getAdminApp: vi.fn(() => ({})),
}))

describe('Auth Utils - Response Helpers', () => {
  describe('unauthorizedResponse', () => {
    it('should return 401 with default message', () => {
      const response = unauthorizedResponse()
      expect(response.status).toBe(401)
    })

    it('should return 401 with custom message', async () => {
      const response = unauthorizedResponse('Custom message')
      expect(response.status).toBe(401)
      const body = await response.json()
      expect(body.error).toBe('Custom message')
      expect(body.code).toBe('UNAUTHORIZED')
    })
  })

  describe('forbiddenResponse', () => {
    it('should return 403 with default message', () => {
      const response = forbiddenResponse()
      expect(response.status).toBe(403)
    })

    it('should return 403 with custom message', async () => {
      const response = forbiddenResponse('No permission')
      expect(response.status).toBe(403)
      const body = await response.json()
      expect(body.error).toBe('No permission')
      expect(body.code).toBe('FORBIDDEN')
    })
  })
})

describe('Auth Utils - verifyAuth', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should return null for missing Authorization header', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test')
    const result = await verifyAuth(request)
    expect(result).toBeNull()
  })

  it('should return null for invalid Authorization format', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Basic token123' },
    })
    const result = await verifyAuth(request)
    expect(result).toBeNull()
  })

  it('should return null for empty Bearer token', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Bearer ' },
    })
    const result = await verifyAuth(request)
    expect(result).toBeNull()
  })

  it('should verify valid token and return user data', async () => {
    const mockDecodedToken = {
      uid: 'user123',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://example.com/avatar.jpg',
    }

    // Mock environment variables
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_KEY', '{"project_id":"test"}')

    // Re-mock with specific behavior
    vi.doMock('firebase-admin/auth', () => ({
      getAuth: vi.fn(() => ({
        verifyIdToken: vi.fn().mockResolvedValue(mockDecodedToken),
      })),
    }))

    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminApp: vi.fn(() => ({})),
    }))

    const { verifyAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Bearer valid-token' },
    })

    const result = await verifyAuth(request)
    expect(result).toEqual(mockDecodedToken)

    vi.unstubAllEnvs()
  })

  it('should return null when token verification fails', async () => {
    vi.stubEnv('FIREBASE_SERVICE_ACCOUNT_KEY', '{"project_id":"test"}')

    vi.doMock('firebase-admin/auth', () => ({
      getAuth: vi.fn(() => ({
        verifyIdToken: vi.fn().mockRejectedValue(new Error('Invalid token')),
      })),
    }))

    vi.doMock('@/lib/firebase-admin', () => ({
      getAdminApp: vi.fn(() => ({})),
    }))

    const { verifyAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test', {
      headers: { Authorization: 'Bearer invalid-token' },
    })

    const result = await verifyAuth(request)
    expect(result).toBeNull()

    vi.unstubAllEnvs()
  })
})

describe('Auth Utils - requireAuth middleware', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
  })

  it('should return 401 when auth fails', async () => {
    const { requireAuth } = await import('@/lib/auth-utils')
    const request = new NextRequest('http://localhost/api/test')
    const handler = vi.fn()

    const response = await requireAuth(request, handler)

    expect(response.status).toBe(401)
    expect(handler).not.toHaveBeenCalled()
  })
})
