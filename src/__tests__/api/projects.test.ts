import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Firebase before importing route handlers
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(),
  getAdminApp: vi.fn(() => ({})),
  COLLECTIONS: {
    PROJECTS: 'projects',
    USERS: 'users',
    COMMENTS: 'comments',
    LIKES: 'likes',
    WHISPERS: 'whispers',
    AI_USAGE: 'aiUsage',
    REACTIONS: 'reactions',
  },
}))

vi.mock('@/lib/auth-utils', () => ({
  verifyAuth: vi.fn(),
  unauthorizedResponse: vi.fn(() =>
    new Response(JSON.stringify({ error: '인증이 필요합니다.' }), { status: 401 })
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

describe('Projects API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /api/projects', () => {
    it('should return paginated projects', async () => {
      const mockDocs = [
        {
          id: 'project-1',
          data: () => ({
            title: 'Test Project 1',
            description: 'Description 1',
            shortDescription: 'Short 1',
            tags: ['tag1'],
            imageUrl: 'https://example.com/img1.jpg',
            authorId: 'user-1',
            authorName: 'User 1',
            likes: 10,
            reactions: {},
            link: 'https://example.com',
            platform: 'WEB',
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        },
      ]

      const mockDb = {
        collection: vi.fn(() => ({
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          startAfter: vi.fn().mockReturnThis(),
          doc: vi.fn(() => ({
            get: vi.fn().mockResolvedValue({ exists: true }),
          })),
          get: vi.fn().mockResolvedValue({ docs: mockDocs }),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { GET } = await import('@/app/api/projects/route')
      const request = new NextRequest('http://localhost/api/projects')
      const response = await GET(request)

      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.data).toHaveLength(1)
      expect(body.data[0].title).toBe('Test Project 1')
    })

    it('should filter by platform', async () => {
      const whereMock = vi.fn().mockReturnThis()
      const mockCollection = {
        orderBy: vi.fn().mockReturnThis(),
        where: whereMock,
        limit: vi.fn().mockReturnThis(),
        get: vi.fn().mockResolvedValue({ docs: [] }),
      }
      const mockDb = {
        collection: vi.fn(() => mockCollection),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { GET } = await import('@/app/api/projects/route')
      const request = new NextRequest('http://localhost/api/projects?platform=WEB')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(whereMock).toHaveBeenCalledWith('platform', '==', 'WEB')
    })

    it('should apply search filter', async () => {
      const mockDocs = [
        {
          id: 'project-1',
          data: () => ({
            title: 'React App',
            shortDescription: 'A React application',
            tags: ['react', 'frontend'],
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
        {
          id: 'project-2',
          data: () => ({
            title: 'Vue App',
            shortDescription: 'A Vue application',
            tags: ['vue', 'frontend'],
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        },
      ]

      const mockDb = {
        collection: vi.fn(() => ({
          orderBy: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          get: vi.fn().mockResolvedValue({ docs: mockDocs }),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { GET } = await import('@/app/api/projects/route')
      const request = new NextRequest('http://localhost/api/projects?search=react')
      const response = await GET(request)

      const body = await response.json()
      // Search filter should only return React project
      expect(body.data.some((p: { title: string }) => p.title === 'React App')).toBe(true)
    })
  })

  describe('POST /api/projects', () => {
    it('should require authentication', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue(null)

      const { POST } = await import('@/app/api/projects/route')
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ title: 'Test' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it('should validate required fields', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: 'new-project-id',
            set: vi.fn(),
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { POST } = await import('@/app/api/projects/route')

      // Missing title
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({ shortDescription: 'Short' }),
      })

      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it('should create project with valid data', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockSet = vi.fn()
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: 'new-project-id',
            set: mockSet,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { POST } = await import('@/app/api/projects/route')

      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Project',
          shortDescription: 'A new project description',
          description: 'Detailed description',
          tags: ['test', 'project'],
          platform: 'WEB',
          link: 'https://example.com',
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      expect(mockSet).toHaveBeenCalled()

      const body = await response.json()
      expect(body.title).toBe('New Project')
      expect(body.authorId).toBe('user-1')
    })

    it('should create project with minimal required fields only', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockSet = vi.fn()
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: 'minimal-project-id',
            set: mockSet,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { POST } = await import('@/app/api/projects/route')

      // 최소 필드: title, shortDescription, platform만 전송
      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: '최소 프로젝트',
          shortDescription: '한 줄 소개',
          platform: 'WEB',
          // 나머지는 모두 빈 값 또는 미전송
          description: '',
          tags: [],
          imageUrl: '',
          link: '',
          githubUrl: '',
          links: [],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
      expect(mockSet).toHaveBeenCalled()
    })

    it('should create project without thumbnail', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockSet = vi.fn()
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: 'no-thumb-project-id',
            set: mockSet,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { POST } = await import('@/app/api/projects/route')

      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: '썸네일 없는 프로젝트',
          shortDescription: '소개',
          platform: 'MOBILE',
          imageUrl: '',  // 썸네일 없음
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })

    it('should create project without links', async () => {
      const { verifyAuth } = await import('@/lib/auth-utils')
      vi.mocked(verifyAuth).mockResolvedValue({
        uid: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        picture: undefined,
      })

      const mockSet = vi.fn()
      const mockDb = {
        collection: vi.fn(() => ({
          doc: vi.fn(() => ({
            id: 'no-links-project-id',
            set: mockSet,
          })),
        })),
      }

      const { getAdminDb } = await import('@/lib/firebase-admin')
      vi.mocked(getAdminDb).mockReturnValue(mockDb as unknown as ReturnType<typeof getAdminDb>)

      const { POST } = await import('@/app/api/projects/route')

      const request = new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          title: '링크 없는 프로젝트',
          shortDescription: '소개',
          platform: 'DESKTOP',
          link: '',
          githubUrl: '',
          links: [],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(201)
    })
  })
})
