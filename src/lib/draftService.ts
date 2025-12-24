/**
 * Draft Service
 *
 * Manages:
 * - Auto-saving form data to localStorage
 * - Loading drafts on page revisit
 * - Managing AI candidates per draft
 */

import { DraftData, AiGenerationCandidate, AiGeneratedContent, ProjectPlatform } from './types'

const STORAGE_KEYS = {
  DRAFTS: 'sidedish_drafts',
  CURRENT_DRAFT_ID: 'sidedish_current_draft_id',
}

const AUTO_SAVE_DEBOUNCE_MS = 1000
const MAX_DRAFTS = 5 // Maximum number of drafts to keep

// Generate a unique draft ID
export const generateDraftId = (): string => {
  return `draft_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Generate a unique candidate ID
export const generateCandidateId = (): string => {
  return `candidate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

// Get all drafts from localStorage
const getAllDrafts = (): DraftData[] => {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DRAFTS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save all drafts to localStorage
const saveAllDrafts = (drafts: DraftData[]): void => {
  if (typeof window === 'undefined') return

  // Keep only the most recent drafts
  const sortedDrafts = drafts.sort((a, b) => b.lastSavedAt - a.lastSavedAt)
  const trimmedDrafts = sortedDrafts.slice(0, MAX_DRAFTS)

  localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(trimmedDrafts))
}

// Get a specific draft by ID
export const getDraft = (draftId: string): DraftData | null => {
  const drafts = getAllDrafts()
  return drafts.find(d => d.id === draftId) || null
}

// Get current draft ID from sessionStorage (to persist across same-session navigation)
export const getCurrentDraftId = (): string | null => {
  if (typeof window === 'undefined') return null
  return sessionStorage.getItem(STORAGE_KEYS.CURRENT_DRAFT_ID)
}

// Set current draft ID
export const setCurrentDraftId = (draftId: string): void => {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEYS.CURRENT_DRAFT_ID, draftId)
}

// Clear current draft ID (when submitting)
export const clearCurrentDraftId = (): void => {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEYS.CURRENT_DRAFT_ID)
}

// Create a new draft
export const createDraft = (userId: string): DraftData => {
  const now = Date.now()
  const draftId = generateDraftId()

  const draft: DraftData = {
    id: draftId,
    title: '',
    shortDescription: '',
    description: '',
    tags: [],
    imageUrl: '',
    link: '',
    githubUrl: '',
    links: [],
    platform: 'WEB',
    isBeta: false,
    aiCandidates: [],
    selectedCandidateId: null,
    generationCount: 0,
    lastSavedAt: now,
    createdAt: now,
  }

  const drafts = getAllDrafts()
  drafts.push(draft)
  saveAllDrafts(drafts)
  setCurrentDraftId(draftId)

  return draft
}

// Save/update a draft
export const saveDraft = (draft: DraftData): void => {
  draft.lastSavedAt = Date.now()

  const drafts = getAllDrafts()
  const existingIndex = drafts.findIndex(d => d.id === draft.id)

  if (existingIndex >= 0) {
    drafts[existingIndex] = draft
  } else {
    drafts.push(draft)
  }

  saveAllDrafts(drafts)
}

// Delete a draft
export const deleteDraft = (draftId: string): void => {
  const drafts = getAllDrafts().filter(d => d.id !== draftId)
  saveAllDrafts(drafts)

  if (getCurrentDraftId() === draftId) {
    clearCurrentDraftId()
  }
}

// Add an AI-generated candidate to a draft
export const addAiCandidate = (
  draftId: string,
  content: AiGeneratedContent
): AiGenerationCandidate => {
  const draft = getDraft(draftId)
  if (!draft) throw new Error('Draft not found')

  const candidate: AiGenerationCandidate = {
    id: generateCandidateId(),
    content,
    isSelected: false,
  }

  // Deselect all existing candidates
  draft.aiCandidates.forEach(c => c.isSelected = false)

  // Add new candidate and select it
  candidate.isSelected = true
  draft.aiCandidates.push(candidate)
  draft.selectedCandidateId = candidate.id
  draft.generationCount += 1

  saveDraft(draft)
  return candidate
}

// Select a candidate
export const selectCandidate = (draftId: string, candidateId: string): void => {
  const draft = getDraft(draftId)
  if (!draft) return

  draft.aiCandidates.forEach(c => {
    c.isSelected = c.id === candidateId
  })
  draft.selectedCandidateId = candidateId
  saveDraft(draft)
}

// Update a candidate's content (for editing)
export const updateCandidateContent = (
  draftId: string,
  candidateId: string,
  content: Partial<AiGeneratedContent>
): void => {
  const draft = getDraft(draftId)
  if (!draft) return

  const candidate = draft.aiCandidates.find(c => c.id === candidateId)
  if (candidate) {
    candidate.content = { ...candidate.content, ...content }
    saveDraft(draft)
  }
}

// Get or create current draft for a user
export const getOrCreateDraft = (userId: string): DraftData => {
  const currentDraftId = getCurrentDraftId()

  if (currentDraftId) {
    const existingDraft = getDraft(currentDraftId)
    if (existingDraft) {
      return existingDraft
    }
  }

  // Create new draft if none exists
  return createDraft(userId)
}

// Update draft form data
export interface DraftFormData {
  title?: string
  shortDescription?: string
  description?: string
  tags?: string[]
  imageUrl?: string
  link?: string
  githubUrl?: string
  platform?: ProjectPlatform
  isBeta?: boolean
}

export const updateDraftFormData = (draftId: string, formData: DraftFormData): void => {
  const draft = getDraft(draftId)
  if (!draft) return

  Object.assign(draft, formData)
  saveDraft(draft)
}

// Debounced auto-save helper
let autoSaveTimer: NodeJS.Timeout | null = null

export const debouncedSaveDraft = (draft: DraftData): void => {
  if (autoSaveTimer) {
    clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = setTimeout(() => {
    saveDraft(draft)
    autoSaveTimer = null
  }, AUTO_SAVE_DEBOUNCE_MS)
}

// Check if draft has unsaved changes (for beforeunload warning)
export const hasUnsavedChanges = (draft: DraftData): boolean => {
  return !!(
    draft.title ||
    draft.description ||
    draft.shortDescription ||
    draft.tags.length > 0 ||
    draft.imageUrl ||
    draft.link ||
    draft.githubUrl
  )
}

// Format last saved time for display
export const formatLastSaved = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp

  if (diff < 60000) {
    return '방금 저장됨'
  } else if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000)
    return `${minutes}분 전 저장됨`
  } else if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours}시간 전 저장됨`
  } else {
    const date = new Date(timestamp)
    return `${date.getMonth() + 1}/${date.getDate()} 저장됨`
  }
}
