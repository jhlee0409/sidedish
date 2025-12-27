import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock dependencies before importing route handler
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
  getAdminApp: vi.fn(() => ({})),
  COLLECTIONS: {
    USERS: 'users',
    PROJECTS: 'projects',
    COMMENTS: 'comments',
    LIKES: 'likes',
    WHISPERS: 'whispers',
    REACTIONS: 'reactions',
  },
}))

vi.mock('@/lib/auth-utils', () => ({
  verifyAuth: vi.fn(),
  unauthorizedResponse: vi.fn(
    () => new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 })
  ),
}))

vi.mock('firebase-admin/firestore', () => ({
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date('2024-01-01'),
      toMillis: () => 1704067200000,
    })),
  },
}))

vi.mock('@vercel/blob', () => ({
  del: vi.fn().mockResolvedValue(undefined),
}))

describe('Users API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/users/[id]', () => {
    it('should return user data', async () => {
      const mockUserDoc = {
        exists: true,
        id: 'user-1',
        data: () => ({
          name: 'Test User',
          avatarUrl: 'https://example.com/avatar.jpg',
          role: 'user',
          isProfileComplete: true,
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

      const { GET } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/user-1')
      const response = await GET(request, { params: Promise.resolve({ id: 'user-1' }) })

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.name).toBe('Test User')
      expect(body.avatarUrl).toBe('https://example.com/avatar.jpg')
    })

    it('should return 404 for non-existent user', async () => {
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: false }),
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { GET } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/non-existent')
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) })

      expect(response.status).toBe(404)
    })
  })

  describe('PATCH /api/users/[id]', () => {
    it('should require authentication', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue(null)

      const { PATCH } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
      expect(response.status).toBe(401)
    })

    it('should reject updating other users profile', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { PATCH } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/user-2', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'New Name' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'user-2' }) })
      expect(response.status).toBe(403)
    })

    it('should validate nickname length', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const { PATCH } = await import('@/app/api/users/[id]/route')

      // Too short
      const request = new NextRequest('http://localhost/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'A' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
      expect(response.status).toBe(400)
      const body = await response.json()
      expect(body.error).toContain('2자')
    })

    it('should update user profile successfully', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      const mockUserDoc = {
        exists: true,
        id: 'user-1',
        data: () => ({
          name: 'Updated Name',
          avatarUrl: 'https://new.com/avatar.jpg',
          role: 'user',
          isProfileComplete: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
        }),
      }

      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue(mockUserDoc),
            update: mockUpdate,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { PATCH } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/user-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated Name' }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })
      expect(response.status).toBe(200)
      expect(mockUpdate).toHaveBeenCalled()
    })

    describe('Avatar deletion on update', () => {
      it('should delete previous Vercel Blob avatar when updating with new avatar', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')

        const previousBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/old-avatar.webp'
        const newBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/new-avatar.webp'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: previousBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockUpdatedDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: newBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        let getCallCount = 0
        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockImplementation(() => {
                getCallCount++
                return Promise.resolve(getCallCount === 1 ? mockUserDoc : mockUpdatedDoc)
              }),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: newBlobUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        expect(response.status).toBe(200)
        expect(del).toHaveBeenCalledWith(previousBlobUrl)
      })

      it('should NOT delete previous avatar if it is an OAuth URL (not Vercel Blob)', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')
        vi.mocked(del).mockClear()

        const oauthAvatarUrl = 'https://lh3.googleusercontent.com/a/test-avatar'
        const newBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/new-avatar.webp'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: oauthAvatarUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockUpdatedDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: newBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        let getCallCount = 0
        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockImplementation(() => {
                getCallCount++
                return Promise.resolve(getCallCount === 1 ? mockUserDoc : mockUpdatedDoc)
              }),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: newBlobUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        expect(response.status).toBe(200)
        expect(del).not.toHaveBeenCalled()
      })

      it('should NOT delete avatar if new URL is same as previous', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')
        vi.mocked(del).mockClear()

        const sameUrl = 'https://test.public.blob.vercel-storage.com/sidedish/same-avatar.webp'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: sameUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockResolvedValue(mockUserDoc),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: sameUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        expect(response.status).toBe(200)
        expect(del).not.toHaveBeenCalled()
      })

      it('should NOT delete avatar if previous avatar is empty', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')
        vi.mocked(del).mockClear()

        const newBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/new-avatar.webp'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: '', // No previous avatar
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockUpdatedDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: newBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        let getCallCount = 0
        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockImplementation(() => {
                getCallCount++
                return Promise.resolve(getCallCount === 1 ? mockUserDoc : mockUpdatedDoc)
              }),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: newBlobUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        expect(response.status).toBe(200)
        expect(del).not.toHaveBeenCalled()
      })

      it('should continue update even if blob deletion fails', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')
        vi.mocked(del).mockRejectedValue(new Error('Blob deletion failed'))

        const previousBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/old-avatar.webp'
        const newBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/new-avatar.webp'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: previousBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockUpdatedDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: newBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        let getCallCount = 0
        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockImplementation(() => {
                getCallCount++
                return Promise.resolve(getCallCount === 1 ? mockUserDoc : mockUpdatedDoc)
              }),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: newBlobUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        // Update should succeed despite deletion failure
        expect(response.status).toBe(200)
        expect(del).toHaveBeenCalledWith(previousBlobUrl)
        expect(mockUpdate).toHaveBeenCalled()
        expect(consoleSpy).toHaveBeenCalledWith('Failed to delete previous avatar:', expect.any(Error))

        consoleSpy.mockRestore()
      })

      it('should delete Vercel Blob avatar when resetting to OAuth original', async () => {
        const { verifyAuth } = await import('@/lib/auth-utils')
        vi.mocked(verifyAuth).mockResolvedValue({
          uid: 'user-1',
          email: 'test@example.com',
          name: 'Test User',
          picture: undefined,
        })

        const { del } = await import('@vercel/blob')
        vi.mocked(del).mockClear()

        const customBlobUrl = 'https://test.public.blob.vercel-storage.com/sidedish/custom-avatar.webp'
        const originalOAuthUrl = 'https://lh3.googleusercontent.com/a/original-avatar'

        const mockUpdate = vi.fn().mockResolvedValue(undefined)
        const mockUserDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: customBlobUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        const mockUpdatedDoc = {
          exists: true,
          id: 'user-1',
          data: () => ({
            name: 'Test User',
            avatarUrl: originalOAuthUrl,
            role: 'user',
            isProfileComplete: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
          }),
        }

        let getCallCount = 0
        const mockDb = {
          collection: vi.fn(() => ({
            doc: vi.fn(() => ({
              get: vi.fn().mockImplementation(() => {
                getCallCount++
                return Promise.resolve(getCallCount === 1 ? mockUserDoc : mockUpdatedDoc)
              }),
              update: mockUpdate,
            })),
          })),
        }

        const { getAdminDb } = await import('@/lib/firebase-admin')
        vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

        const { PATCH } = await import('@/app/api/users/[id]/route')
        const request = new NextRequest('http://localhost/api/users/user-1', {
          method: 'PATCH',
          body: JSON.stringify({ avatarUrl: originalOAuthUrl }),
        })

        const response = await PATCH(request, { params: Promise.resolve({ id: 'user-1' }) })

        expect(response.status).toBe(200)
        // Should delete the custom blob URL when reverting to OAuth
        expect(del).toHaveBeenCalledWith(customBlobUrl)
      })
    })

    it('should create new user if not exists', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'new-user',
        email: 'new@example.com',
        name: 'New User',
        picture: undefined,
      })

      const mockSet = vi.fn().mockResolvedValue(undefined)
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: false }),
            set: mockSet,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { PATCH } = await import('@/app/api/users/[id]/route')
      const request = new NextRequest('http://localhost/api/users/new-user', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'New User',
          avatarUrl: 'https://example.com/avatar.jpg',
          isProfileComplete: true,
          agreements: {
            termsOfService: true,
            privacyPolicy: true,
            marketing: false,
          },
        }),
      })

      const response = await PATCH(request, { params: Promise.resolve({ id: 'new-user' }) })

      expect(response.status).toBe(200)
      expect(mockSet).toHaveBeenCalled()
    })
  })
})
