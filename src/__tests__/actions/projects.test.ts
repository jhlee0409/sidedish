/**
 * Server Actions Tests for Projects
 *
 * Tests for Next.js Server Actions implementing:
 * - Authentication validation
 * - Input validation with security-utils
 * - Firestore operations
 * - Revalidation calls
 * - Error handling
 *
 * @see src/actions/projects.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { Timestamp } from 'firebase-admin/firestore'

// Mock next/cache before importing actions
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
  })),
}))

// Mock firebase-admin modules
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn(() => ({
    name: '[DEFAULT]',
    options: {},
  })),
  getApps: vi.fn(() => []),
  cert: vi.fn((credential) => credential),
}))

vi.mock('firebase-admin/auth', () => ({
  getAuth: vi.fn(() => ({
    verifyIdToken: vi.fn(),
  })),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
  })),
  Timestamp: {
    now: vi.fn(() => ({
      toDate: () => new Date('2025-01-01T00:00:00Z'),
      seconds: 1704067200,
      nanoseconds: 0,
    })),
  },
}))

// Mock firebase-admin lib
vi.mock('@/lib/firebase-admin', () => ({
  getAdminApp: vi.fn(() => ({ name: '[DEFAULT]' })),
  getAdminDb: vi.fn(),
  COLLECTIONS: {
    PROJECTS: 'projects',
    COMMENTS: 'comments',
    LIKES: 'likes',
  },
}))

describe('Server Actions - Projects', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('createProject', () => {
    it('should reject unauthenticated requests', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Test Project')
      formData.append('shortDescription', 'Short description')
      formData.append('description', 'Long description')
      formData.append('tags', 'tag1,tag2')
      formData.append('platform', 'WEB')

      const result = await createProject(null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('로그인이 필요합니다.')
      }
    })

    it('should validate title length constraints', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'a'.repeat(101)) // 101 characters (max is 100)
      formData.append('shortDescription', 'Short description')
      formData.append('description', 'Long description')

      const result = await createProject(null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('제목')
      }
    })

    it('should validate shortDescription length constraints', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Valid Title')
      formData.append('shortDescription', 'a'.repeat(201)) // 201 characters (max is 200)
      formData.append('description', 'Long description')

      const result = await createProject(null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('간단 소개')
      }
    })

    it('should validate tags', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Valid Title')
      formData.append('shortDescription', 'Short description')
      formData.append('description', 'Long description')
      // PROJECT_TAGS_MAX_COUNT = 10, so 11 tags should fail
      formData.append(
        'tags',
        'tag1,tag2,tag3,tag4,tag5,tag6,tag7,tag8,tag9,tag10,tag11'
      )

      const result = await createProject(null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('태그')
        expect(result.error).toContain('10개')
      }
    })

    it('should create project successfully with valid data', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')
      const { revalidatePath, revalidateTag } = await import('next/cache')

      const mockDoc = vi.fn()
      const mockSet = vi.fn().mockResolvedValue(undefined)
      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      mockDoc.mockReturnValue({
        id: 'project123',
        set: mockSet,
      })

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Test Project')
      formData.append('shortDescription', 'A test project description')
      formData.append('description', 'Long description of the project')
      formData.append('tags', 'react,typescript,nextjs')
      formData.append('platform', 'WEB')
      formData.append('isBeta', 'false')

      const result = await createProject(null, formData)

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('project123')
      }
      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'project123',
          title: 'Test Project',
          authorId: 'user123',
          authorName: 'Test User',
          likes: 0,
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidatePath).toHaveBeenCalledWith('/menu/project123')
      expect(revalidateTag).toHaveBeenCalledWith('projects', 'max')
    })

    it('should handle Firestore errors gracefully', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockDoc = vi.fn()
      const mockSet = vi.fn().mockRejectedValue(new Error('Firestore error'))
      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      mockDoc.mockReturnValue({
        id: 'project123',
        set: mockSet,
      })

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
          name: 'Test User',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { createProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Test Project')
      formData.append('shortDescription', 'Short description')
      formData.append('description', 'Long description')

      const result = await createProject(null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('프로젝트 생성에 실패했습니다.')
      }
    })
  })

  describe('updateProject', () => {
    it('should reject unauthenticated requests', async () => {
      const { cookies } = await import('next/headers')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any)

      const { updateProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Updated Title')

      const result = await updateProject('project123', null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('로그인이 필요합니다.')
      }
    })

    it('should reject non-owner updates', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          authorId: 'otherUser',
        }),
      })

      const mockDoc = vi.fn(() => ({
        get: mockGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { updateProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Updated Title')

      const result = await updateProject('project123', null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('권한이 없습니다.')
      }
    })

    it('should update project successfully for owner', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')
      const { revalidatePath, revalidateTag } = await import('next/cache')

      const mockUpdate = vi.fn().mockResolvedValue(undefined)
      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          authorId: 'user123',
          title: 'Old Title',
        }),
      })

      const mockDoc = vi.fn(() => ({
        get: mockGet,
        update: mockUpdate,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { updateProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Updated Title')

      const result = await updateProject('project123', null, formData)

      expect(result.success).toBe(true)
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Updated Title',
        })
      )
      expect(revalidatePath).toHaveBeenCalledWith('/menu/project123')
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidateTag).toHaveBeenCalledWith('projects', 'max')
    })

    it('should return error if project does not exist', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      })

      const mockDoc = vi.fn(() => ({
        get: mockGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { updateProject } = await import('@/actions/projects')

      const formData = new FormData()
      formData.append('title', 'Updated Title')

      const result = await updateProject('nonexistent', null, formData)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('프로젝트를 찾을 수 없습니다.')
      }
    })
  })

  describe('deleteProject', () => {
    it('should reject unauthenticated requests', async () => {
      const { cookies } = await import('next/headers')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any)

      const { deleteProject } = await import('@/actions/projects')

      const result = await deleteProject('project123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('로그인이 필요합니다.')
      }
    })

    it('should reject non-owner deletions', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockGet = vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          authorId: 'otherUser',
        }),
      })

      const mockDoc = vi.fn(() => ({
        get: mockGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { deleteProject } = await import('@/actions/projects')

      const result = await deleteProject('project123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('권한이 없습니다.')
      }
    })

    it('should delete project with cascade delete (comments, likes)', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')
      const { revalidatePath, revalidateTag } = await import('next/cache')

      const mockBatchDelete = vi.fn()
      const mockBatchCommit = vi.fn().mockResolvedValue(undefined)
      const mockBatch = vi.fn(() => ({
        delete: mockBatchDelete,
        commit: mockBatchCommit,
      }))

      const mockCommentsSnapshot = {
        docs: [
          { ref: 'comment1-ref' },
          { ref: 'comment2-ref' },
        ],
      }

      const mockLikesSnapshot = {
        docs: [
          { ref: 'like1-ref' },
        ],
      }

      const mockCommentQuery = {
        get: vi.fn().mockResolvedValue(mockCommentsSnapshot),
      }

      const mockLikeQuery = {
        get: vi.fn().mockResolvedValue(mockLikesSnapshot),
      }

      const mockProjectDoc = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            authorId: 'user123',
          }),
        }),
      }

      const mockCollection = vi.fn((name: string) => {
        if (name === 'projects') {
          return {
            doc: () => mockProjectDoc,
          }
        }
        if (name === 'comments') {
          return {
            where: () => mockCommentQuery,
          }
        }
        if (name === 'likes') {
          return {
            where: () => mockLikeQuery,
          }
        }
        return {}
      })

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
        batch: mockBatch,
      } as any)

      const { deleteProject } = await import('@/actions/projects')

      const result = await deleteProject('project123')

      expect(result.success).toBe(true)
      expect(mockBatchDelete).toHaveBeenCalledTimes(4) // 2 comments + 1 like + 1 project
      expect(mockBatchCommit).toHaveBeenCalled()
      expect(revalidatePath).toHaveBeenCalledWith('/dashboard')
      expect(revalidateTag).toHaveBeenCalledWith('projects', 'max')
    })

    it('should return error if project does not exist', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockGet = vi.fn().mockResolvedValue({
        exists: false,
      })

      const mockDoc = vi.fn(() => ({
        get: mockGet,
      }))

      const mockCollection = vi.fn(() => ({
        doc: mockDoc,
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { deleteProject } = await import('@/actions/projects')

      const result = await deleteProject('nonexistent')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('프로젝트를 찾을 수 없습니다.')
      }
    })
  })

  describe('toggleLike', () => {
    it('should reject unauthenticated requests', async () => {
      const { cookies } = await import('next/headers')

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => undefined),
      } as any)

      const { toggleLike } = await import('@/actions/projects')

      const result = await toggleLike('project123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('로그인이 필요합니다.')
      }
    })

    it('should add like if not already liked', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')
      const { revalidatePath, revalidateTag } = await import('next/cache')

      const mockAdd = vi.fn().mockResolvedValue({ id: 'like123' })
      const mockUpdate = vi.fn().mockResolvedValue(undefined)

      const mockProjectGet = vi.fn()
        .mockResolvedValueOnce({
          data: () => ({ likes: 5 }),
        })
        .mockResolvedValueOnce({
          data: () => ({ likes: 6 }),
        })

      const mockProjectDoc = {
        get: mockProjectGet,
        update: mockUpdate,
      }

      const mockLikesQuery = {
        get: vi.fn().mockResolvedValue({
          empty: true,
          docs: [],
        }),
      }

      const mockCollection = vi.fn((name: string) => {
        if (name === 'projects') {
          return {
            doc: () => mockProjectDoc,
          }
        }
        if (name === 'likes') {
          return {
            add: mockAdd,
            where: () => ({
              where: () => ({
                limit: () => mockLikesQuery,
              }),
            }),
          }
        }
        return {}
      })

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { toggleLike } = await import('@/actions/projects')

      const result = await toggleLike('project123')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.liked).toBe(true)
        expect(result.data?.newCount).toBe(6)
      }
      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user123',
          projectId: 'project123',
        })
      )
      expect(mockUpdate).toHaveBeenCalledWith({ likes: 6 })
      expect(revalidatePath).toHaveBeenCalledWith('/menu/project123')
      expect(revalidateTag).toHaveBeenCalledWith('projects', 'max')
    })

    it('should remove like if already liked', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')
      const { revalidatePath, revalidateTag } = await import('next/cache')

      const mockDelete = vi.fn().mockResolvedValue(undefined)
      const mockUpdate = vi.fn().mockResolvedValue(undefined)

      const mockProjectGet = vi.fn()
        .mockResolvedValueOnce({
          data: () => ({ likes: 5 }),
        })
        .mockResolvedValueOnce({
          data: () => ({ likes: 4 }),
        })

      const mockProjectDoc = {
        get: mockProjectGet,
        update: mockUpdate,
      }

      const mockLikesQuery = {
        get: vi.fn().mockResolvedValue({
          empty: false,
          docs: [
            {
              ref: { delete: mockDelete },
            },
          ],
        }),
      }

      const mockCollection = vi.fn((name: string) => {
        if (name === 'projects') {
          return {
            doc: () => mockProjectDoc,
          }
        }
        if (name === 'likes') {
          return {
            where: () => ({
              where: () => ({
                limit: () => mockLikesQuery,
              }),
            }),
          }
        }
        return {}
      })

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { toggleLike } = await import('@/actions/projects')

      const result = await toggleLike('project123')

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.liked).toBe(false)
        expect(result.data?.newCount).toBe(4)
      }
      expect(mockDelete).toHaveBeenCalled()
      expect(mockUpdate).toHaveBeenCalledWith({ likes: 4 })
      expect(revalidatePath).toHaveBeenCalledWith('/menu/project123')
      expect(revalidateTag).toHaveBeenCalledWith('projects', 'max')
    })

    it('should handle Firestore errors gracefully', async () => {
      const { cookies } = await import('next/headers')
      const { getAuth } = await import('firebase-admin/auth')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const mockLikesQuery = {
        get: vi.fn().mockRejectedValue(new Error('Firestore error')),
      }

      const mockCollection = vi.fn(() => ({
        where: () => ({
          where: () => ({
            limit: () => mockLikesQuery,
          }),
        }),
      }))

      vi.mocked(cookies).mockResolvedValue({
        get: vi.fn(() => ({ value: 'valid-token' })),
      } as any)

      vi.mocked(getAuth).mockReturnValue({
        verifyIdToken: vi.fn().mockResolvedValue({
          uid: 'user123',
          email: 'test@example.com',
        }),
      } as any)

      vi.mocked(getAdminDb).mockReturnValue({
        collection: mockCollection,
      } as any)

      const { toggleLike } = await import('@/actions/projects')

      const result = await toggleLike('project123')

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBe('좋아요 처리에 실패했습니다.')
      }
    })
  })
})
