import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

// Mock localStorage before importing the module
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] || null),
  }
})()

vi.stubGlobal('localStorage', localStorageMock)

// Now import the module (after mocking localStorage)
import {
  createDraft,
  getDraft,
  saveDraft,
  deleteDraft,
  getOrCreateDraft,
  setCurrentDraftId,
  getCurrentDraftId,
  clearCurrentDraftId,
} from '@/lib/draftService'
import type { DraftData } from '@/lib/types'

describe('draftService', () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('createDraft', () => {
    it('should create a new draft with default values', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      expect(draft).toBeDefined()
      expect(draft.id).toBeDefined()
      expect(draft.title).toBe('')
      expect(draft.shortDescription).toBe('')
      expect(draft.description).toBe('')
      expect(draft.tags).toEqual([])
      expect(draft.imageUrl).toBe('')
      expect(draft.links).toEqual([])
      expect(draft.platform).toBe('WEB')
      expect(draft.isBeta).toBe(false)
      expect(draft.aiCandidates).toEqual([])
      expect(draft.selectedCandidateId).toBeNull()
      expect(draft.generationCount).toBe(0)
      expect(draft.lastSavedAt).toBeGreaterThan(0)
      expect(draft.createdAt).toBeGreaterThan(0)
    })

    it('should include promotion fields with default values', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      // 홍보 관련 필드가 기본값으로 포함되어야 함
      expect(draft.wantsPromotion).toBe(false)
      expect(draft.selectedPlatforms).toEqual(['x', 'linkedin', 'facebook', 'threads'])
    })

    it('should save draft to localStorage', () => {
      const userId = 'user-123'
      createDraft(userId)

      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should set current draft ID', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      const currentDraftId = getCurrentDraftId()
      expect(currentDraftId).toBe(draft.id)
    })
  })

  describe('getDraft', () => {
    it('should return null for non-existent draft', () => {
      const draft = getDraft('non-existent-id')
      expect(draft).toBeNull()
    })

    it('should retrieve existing draft', () => {
      const userId = 'user-123'
      const createdDraft = createDraft(userId)

      const retrievedDraft = getDraft(createdDraft.id)
      expect(retrievedDraft).not.toBeNull()
      expect(retrievedDraft?.id).toBe(createdDraft.id)
    })
  })

  describe('saveDraft', () => {
    it('should update draft with new values', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      const updatedDraft: DraftData = {
        ...draft,
        title: '업데이트된 제목',
        shortDescription: '업데이트된 소개',
        tags: ['tag1', 'tag2'],
        wantsPromotion: true,
        selectedPlatforms: ['x', 'linkedin'],
      }

      saveDraft(updatedDraft)

      const retrievedDraft = getDraft(draft.id)
      expect(retrievedDraft?.title).toBe('업데이트된 제목')
      expect(retrievedDraft?.shortDescription).toBe('업데이트된 소개')
      expect(retrievedDraft?.tags).toEqual(['tag1', 'tag2'])
      expect(retrievedDraft?.wantsPromotion).toBe(true)
      expect(retrievedDraft?.selectedPlatforms).toEqual(['x', 'linkedin'])
    })

    it('should update lastSavedAt timestamp', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)
      const originalTimestamp = draft.lastSavedAt

      saveDraft({ ...draft, title: '새 제목' })

      const retrievedDraft = getDraft(draft.id)
      // lastSavedAt은 saveDraft에서 Date.now()로 업데이트되므로 원래 값 이상이어야 함
      expect(retrievedDraft?.lastSavedAt).toBeGreaterThanOrEqual(originalTimestamp)
    })
  })

  describe('deleteDraft', () => {
    it('should remove draft from storage', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      deleteDraft(draft.id)

      const retrievedDraft = getDraft(draft.id)
      expect(retrievedDraft).toBeNull()
    })
  })

  describe('getOrCreateDraft', () => {
    it('should create new draft if none exists', () => {
      clearCurrentDraftId()

      const userId = 'user-123'
      const draft = getOrCreateDraft(userId)

      expect(draft).toBeDefined()
      expect(draft.id).toBeDefined()
    })

    it('should return existing draft if current draft ID is set', () => {
      const userId = 'user-123'
      const existingDraft = createDraft(userId)
      setCurrentDraftId(existingDraft.id)

      const draft = getOrCreateDraft(userId)

      expect(draft.id).toBe(existingDraft.id)
    })
  })

  describe('promotion fields persistence', () => {
    it('should persist wantsPromotion when saving', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      saveDraft({
        ...draft,
        wantsPromotion: true,
      })

      const retrieved = getDraft(draft.id)
      expect(retrieved?.wantsPromotion).toBe(true)
    })

    it('should persist selectedPlatforms when saving', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      saveDraft({
        ...draft,
        selectedPlatforms: ['x', 'facebook'],
      })

      const retrieved = getDraft(draft.id)
      expect(retrieved?.selectedPlatforms).toEqual(['x', 'facebook'])
    })

    it('should persist all promotion fields together', () => {
      const userId = 'user-123'
      const draft = createDraft(userId)

      const updatedDraft: DraftData = {
        ...draft,
        title: '테스트 프로젝트',
        shortDescription: '테스트 소개',
        wantsPromotion: true,
        selectedPlatforms: ['linkedin', 'threads'],
      }

      saveDraft(updatedDraft)

      const retrieved = getDraft(draft.id)
      expect(retrieved?.title).toBe('테스트 프로젝트')
      expect(retrieved?.wantsPromotion).toBe(true)
      expect(retrieved?.selectedPlatforms).toEqual(['linkedin', 'threads'])
    })
  })

  describe('currentDraftId management', () => {
    it('should set and get current draft ID', () => {
      setCurrentDraftId('test-draft-id')
      expect(getCurrentDraftId()).toBe('test-draft-id')
    })

    it('should clear current draft ID', () => {
      setCurrentDraftId('test-draft-id')
      clearCurrentDraftId()
      expect(getCurrentDraftId()).toBeNull()
    })
  })
})
