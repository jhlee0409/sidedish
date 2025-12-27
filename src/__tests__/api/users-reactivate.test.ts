import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock current date to 2024-01-15
const MOCK_NOW = 1705276800000 // 2024-01-15 00:00:00 UTC

// Mock dependencies before importing route handler
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
  getAdminApp: vi.fn(() => ({})),
  COLLECTIONS: {
    USERS: 'users',
    PROJECTS: 'projects',
    COMMENTS: 'comments',
  },
}))

vi.mock('@/lib/auth-utils', () => ({
  verifyAuth: vi.fn(),
  unauthorizedResponse: vi.fn(
    () => new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 })
  ),
  forbiddenResponse: vi.fn(
    (message?: string) => new Response(JSON.stringify({ error: message || '권한이 없습니다.' }), { status: 403 })
  ),
}))

vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date('2024-01-15'),
      toMillis: () => 1705276800000, // 2024-01-15
    })),
  },
}))

describe('POST /api/users/[id]/reactivate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock Date.now() to return consistent time
    vi.spyOn(Date, 'now').mockReturnValue(MOCK_NOW)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should require authentication', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue(null)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-1' }) })
    expect(response.status).toBe(401)
  })

  it('should reject reactivating other users account', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-2/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-2' }) })
    expect(response.status).toBe(403)
  })

  it('should return 404 for non-existent user', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'non-existent',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({ exists: false }),
        })),
      })),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/non-existent/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'non-existent' }) })
    expect(response.status).toBe(404)
  })

  it('should return 400 if account is not withdrawn', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const mockUserDoc = {
      exists: true,
      id: 'user-1',
      data: () => ({
        name: 'Test User',
        isWithdrawn: false, // Not withdrawn
        createdAt: { toDate: () => new Date('2024-01-01') },
      }),
    }

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        })),
      })),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('탈퇴하지 않은')
  })

  it('should return 400 if 30 days have passed since withdrawal', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    // Withdrawn 31 days ago (2023-12-15)
    const withdrawnAt = {
      toMillis: () => 1702598400000, // 2023-12-15
    }

    const mockUserDoc = {
      exists: true,
      id: 'user-1',
      data: () => ({
        name: '탈퇴한 사용자',
        isWithdrawn: true,
        withdrawnAt,
        createdAt: { toDate: () => new Date('2023-01-01') },
      }),
    }

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        })),
      })),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-1' }) })
    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain('30일이 지나')
  })

  it('should successfully reactivate account within 30 days', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    // Withdrawn 10 days ago (2024-01-05)
    const withdrawnAt = {
      toMillis: () => 1704412800000, // 2024-01-05
    }

    const mockUserDoc = {
      exists: true,
      id: 'user-1',
      data: () => ({
        name: '탈퇴한 사용자',
        isWithdrawn: true,
        withdrawnAt,
        withdrawalReason: '서비스 불만족',
        withdrawalFeedback: '피드백 내용',
        createdAt: { toDate: () => new Date('2023-01-01') },
      }),
    }

    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockBatch = {
      update: mockUpdate,
      commit: mockCommit,
    }

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        })),
      })),
      batch: vi.fn(() => mockBatch),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-1' }) })
    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.success).toBe(true)
    expect(body.needsProfileSetup).toBe(true)
    expect(body.message).toContain('복구')

    // Verify that batch update was called with correct fields
    expect(mockUpdate).toHaveBeenCalled()
    expect(mockCommit).toHaveBeenCalled()
  })

  it('should reactivate on exactly day 30', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    // Withdrawn exactly 30 days ago (2023-12-16)
    // Current date mocked as 2024-01-15
    const withdrawnAt = {
      toMillis: () => 1702684800000, // 2023-12-16
    }

    const mockUserDoc = {
      exists: true,
      id: 'user-1',
      data: () => ({
        name: '탈퇴한 사용자',
        isWithdrawn: true,
        withdrawnAt,
        createdAt: { toDate: () => new Date('2023-01-01') },
      }),
    }

    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockBatch = {
      update: vi.fn(),
      commit: mockCommit,
    }

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          get: vi.fn().mockResolvedValue(mockUserDoc),
        })),
      })),
      batch: vi.fn(() => mockBatch),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    const response = await POST(request, { params: Promise.resolve({ id: 'user-1' }) })
    // Day 30 should still be within the window
    expect(response.status).toBe(200)
  })

  it('should clear withdrawal data on reactivation', async () => {
    const { verifyAuth } = await import('@/lib/auth-utils')
    vi.mocked(verifyAuth).mockResolvedValue({
      uid: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: undefined,
    })

    const withdrawnAt = {
      toMillis: () => 1704412800000, // 10 days ago
    }

    const mockUserDoc = {
      exists: true,
      id: 'user-1',
      data: () => ({
        name: '탈퇴한 사용자',
        isWithdrawn: true,
        withdrawnAt,
        withdrawalReason: '서비스 불만족',
        withdrawalFeedback: '피드백 내용',
        createdAt: { toDate: () => new Date('2023-01-01') },
      }),
    }

    const mockDocRef = { id: 'user-1' }
    const mockUpdate = vi.fn().mockResolvedValue(undefined)
    const mockCommit = vi.fn().mockResolvedValue(undefined)
    const mockBatch = {
      update: mockUpdate,
      commit: mockCommit,
    }

    const mockDb = {
      collection: vi.fn(() => ({
        doc: vi.fn(() => ({
          ...mockDocRef,
          get: vi.fn().mockResolvedValue(mockUserDoc),
        })),
      })),
      batch: vi.fn(() => mockBatch),
    }

    const { getAdminDb } = await import('@/lib/firebase-admin')
    vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

    const { POST } = await import('@/app/api/users/[id]/reactivate/route')
    const request = new NextRequest('http://localhost/api/users/user-1/reactivate', {
      method: 'POST',
    })

    await POST(request, { params: Promise.resolve({ id: 'user-1' }) })

    // Verify batch update was called with null values for withdrawal data
    const updateCall = mockUpdate.mock.calls[0]
    const updateData = updateCall[1]

    expect(updateData.isWithdrawn).toBe(false)
    expect(updateData.withdrawnAt).toBeNull()
    expect(updateData.withdrawalReason).toBeNull()
    expect(updateData.withdrawalFeedback).toBeNull()
    expect(updateData.isProfileComplete).toBe(false)
  })
})
