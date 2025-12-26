/**
 * Firebase Admin SDK Tests
 *
 * Singleton 패턴 및 초기화 테스트
 *
 * @see src/lib/firebase-admin.ts
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { App } from 'firebase-admin/app'
import { Firestore } from 'firebase-admin/firestore'

// Mock firebase-admin modules
vi.mock('firebase-admin/app', () => ({
  initializeApp: vi.fn((config) => ({
    name: '[DEFAULT]',
    options: config,
  })),
  getApps: vi.fn(() => []),
  cert: vi.fn((credential) => credential),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: vi.fn(() => ({
    collection: vi.fn(),
  })),
}))

describe('Firebase Admin SDK', () => {
  beforeEach(() => {
    // Reset modules before each test
    vi.resetModules()
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up environment variables
    delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    delete process.env.FIREBASE_PROJECT_ID
    delete process.env.FIREBASE_CLIENT_EMAIL
    delete process.env.FIREBASE_PRIVATE_KEY
  })

  describe('Configuration', () => {
    it('should prioritize FIREBASE_SERVICE_ACCOUNT_KEY', async () => {
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
        project_id: 'test-project',
        client_email: 'test@test.com',
        private_key: 'test-key',
      })

      const { initializeApp } = await import('firebase-admin/app')
      const { getAdminApp } = await import('@/lib/firebase-admin')

      getAdminApp()

      expect(initializeApp).toHaveBeenCalledTimes(1)
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
        })
      )
    })

    it('should fall back to individual environment variables', async () => {
      process.env.FIREBASE_PROJECT_ID = 'test-project'
      process.env.FIREBASE_CLIENT_EMAIL = 'test@test.com'
      process.env.FIREBASE_PRIVATE_KEY = 'test-key\\nwith-newline'

      const { initializeApp } = await import('firebase-admin/app')
      const { getAdminApp } = await import('@/lib/firebase-admin')

      getAdminApp()

      expect(initializeApp).toHaveBeenCalledTimes(1)
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'test-project',
        })
      )
    })

    it('should handle missing credentials gracefully', async () => {
      const { initializeApp } = await import('firebase-admin/app')
      const { getAdminApp } = await import('@/lib/firebase-admin')

      getAdminApp()

      expect(initializeApp).toHaveBeenCalledTimes(1)
      expect(initializeApp).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: undefined,
        })
      )
    })
  })

  describe('Singleton Pattern', () => {
    it('should create only one Admin App instance', async () => {
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
        project_id: 'test-project',
        client_email: 'test@test.com',
        private_key: 'test-key',
      })

      const { initializeApp } = await import('firebase-admin/app')
      const { getAdminApp } = await import('@/lib/firebase-admin')

      const app1 = getAdminApp()
      const app2 = getAdminApp()
      const app3 = getAdminApp()

      expect(app1).toBe(app2)
      expect(app2).toBe(app3)
      expect(initializeApp).toHaveBeenCalledTimes(1)
    })

    it('should reuse existing app from getApps() (hot reload scenario)', async () => {
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
        project_id: 'test-project',
        client_email: 'test@test.com',
        private_key: 'test-key',
      })

      const existingApp = {
        name: '[DEFAULT]',
        options: { projectId: 'test-project' },
      } as App

      const { initializeApp, getApps } = await import('firebase-admin/app')
      vi.mocked(getApps).mockReturnValue([existingApp])

      const { getAdminApp } = await import('@/lib/firebase-admin')

      const app = getAdminApp()

      expect(app).toBe(existingApp)
      expect(initializeApp).not.toHaveBeenCalled()
      expect(getApps).toHaveBeenCalled()
    })

    it('should create only one Firestore instance', async () => {
      process.env.FIREBASE_SERVICE_ACCOUNT_KEY = JSON.stringify({
        project_id: 'test-project',
        client_email: 'test@test.com',
        private_key: 'test-key',
      })

      const { getFirestore } = await import('firebase-admin/firestore')
      const { getAdminDb } = await import('@/lib/firebase-admin')

      const db1 = getAdminDb()
      const db2 = getAdminDb()
      const db3 = getAdminDb()

      expect(db1).toBe(db2)
      expect(db2).toBe(db3)
      expect(getFirestore).toHaveBeenCalledTimes(1)
    })
  })

  describe('Collection Constants', () => {
    it('should export all collection names', async () => {
      const { COLLECTIONS } = await import('@/lib/firebase-admin')

      expect(COLLECTIONS).toEqual({
        PROJECTS: 'projects',
        USERS: 'users',
        COMMENTS: 'comments',
        LIKES: 'likes',
        WHISPERS: 'whispers',
        AI_USAGE: 'aiUsage',
        REACTIONS: 'reactions',
        PROJECT_UPDATES: 'projectUpdates',
        DIGESTS: 'digests',
        DIGEST_SUBSCRIPTIONS: 'digest_subscriptions',
        DIGEST_LOGS: 'digest_logs',
        WEATHER_LOGS: 'weather_logs',
      })
    })
  })

  describe('server-only Protection', () => {
    it('should import server-only at the top of the module', async () => {
      // Read the source file to verify server-only import
      const fs = await import('fs/promises')
      const path = await import('path')

      const filePath = path.resolve(
        process.cwd(),
        'src/lib/firebase-admin.ts'
      )
      const fileContent = await fs.readFile(filePath, 'utf-8')

      // Check that 'server-only' is imported
      expect(fileContent).toContain("import 'server-only'")

      // Check that it's near the top (within first 20 lines)
      const lines = fileContent.split('\n')
      const serverOnlyLineIndex = lines.findIndex((line) =>
        line.includes("import 'server-only'")
      )

      expect(serverOnlyLineIndex).toBeGreaterThanOrEqual(0)
      expect(serverOnlyLineIndex).toBeLessThan(20)
    })
  })
})
