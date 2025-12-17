/**
 * Firebase Mock Utilities for Testing
 *
 * Provides mock implementations for Firebase Admin SDK
 */
import { vi } from 'vitest'

// Mock Firestore document
export interface MockDoc {
  id: string
  data: () => Record<string, unknown>
  exists: boolean
}

// Mock Firestore snapshot
export interface MockSnapshot {
  docs: MockDoc[]
  empty: boolean
}

// Create a mock document
export function createMockDoc(id: string, data: Record<string, unknown>): MockDoc {
  return {
    id,
    data: () => data,
    exists: true,
  }
}

// Create a mock snapshot
export function createMockSnapshot(docs: MockDoc[]): MockSnapshot {
  return {
    docs,
    empty: docs.length === 0,
  }
}

// Mock Firestore query builder
export function createMockQuery(snapshot: MockSnapshot) {
  const query = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(snapshot),
  }
  return query
}

// Mock Firestore collection
export function createMockCollection(snapshot: MockSnapshot) {
  const docRef = {
    id: 'new-doc-id',
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(snapshot.docs[0] || { exists: false, data: () => null }),
  }

  return {
    doc: vi.fn().mockReturnValue(docRef),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    get: vi.fn().mockResolvedValue(snapshot),
  }
}

// Mock Firebase Admin DB
export function createMockDb(collections: Record<string, MockSnapshot>) {
  return {
    collection: vi.fn((name: string) => createMockCollection(collections[name] || { docs: [], empty: true })),
    runTransaction: vi.fn(async (callback: (transaction: unknown) => Promise<unknown>) => {
      const mockTransaction = {
        get: vi.fn().mockResolvedValue({ exists: false, data: () => null }),
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      }
      return callback(mockTransaction)
    }),
  }
}

// Mock authenticated user
export interface MockUser {
  uid: string
  email?: string
  name?: string
  picture?: string
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return {
    uid: 'test-user-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
    ...overrides,
  }
}

// Setup Firebase mocks
export function setupFirebaseMocks(options: {
  db?: ReturnType<typeof createMockDb>
  user?: MockUser | null
} = {}) {
  const { db, user } = options

  // Mock firebase-admin
  vi.doMock('@/lib/firebase-admin', () => ({
    getAdminDb: vi.fn(() => db || createMockDb({})),
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

  // Mock auth-utils
  vi.doMock('@/lib/auth-utils', () => ({
    verifyAuth: vi.fn().mockResolvedValue(user !== undefined ? user : createMockUser()),
    unauthorizedResponse: vi.fn(() =>
      new Response(JSON.stringify({ error: '인증이 필요합니다.', code: 'UNAUTHORIZED' }), { status: 401 })
    ),
    forbiddenResponse: vi.fn(() =>
      new Response(JSON.stringify({ error: '권한이 없습니다.', code: 'FORBIDDEN' }), { status: 403 })
    ),
  }))
}

// Mock Timestamp for Firebase
export const MockTimestamp = {
  now: () => ({
    toDate: () => new Date(),
    toMillis: () => Date.now(),
  }),
  fromDate: (date: Date) => ({
    toDate: () => date,
    toMillis: () => date.getTime(),
  }),
}
