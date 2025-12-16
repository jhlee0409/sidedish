/**
 * AI Generation Limit Service
 *
 * Manages:
 * - Per-draft generation limits (max 3 per draft)
 * - Daily usage limits (max 10 per day per user)
 * - Cooldown between generations (5 seconds)
 */

import { AiUsageRecord, DailyAiUsage } from './types'

const STORAGE_KEYS = {
  USAGE_RECORDS: 'sidedish_ai_usage_records',
  DAILY_USAGE: 'sidedish_ai_daily_usage',
}

const LIMITS = {
  MAX_PER_DRAFT: 3,
  MAX_PER_DAY: 10,
  COOLDOWN_MS: 5000, // 5 seconds
}

// Get today's date in YYYY-MM-DD format
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]
}

// Generate a hash from draft content to prevent abuse through content modification
export const generateDraftHash = (content: string): string => {
  // Simple hash function for client-side use
  let hash = 0
  const str = content.trim().toLowerCase()
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36)
}

// Get all usage records from localStorage
const getUsageRecords = (): AiUsageRecord[] => {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USAGE_RECORDS)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

// Save usage records to localStorage
const saveUsageRecords = (records: AiUsageRecord[]): void => {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEYS.USAGE_RECORDS, JSON.stringify(records))
}

// Get daily usage from localStorage
const getDailyUsage = (userId: string): DailyAiUsage | null => {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_USAGE)
    const records: DailyAiUsage[] = data ? JSON.parse(data) : []
    const today = getTodayString()
    return records.find(r => r.userId === userId && r.date === today) || null
  } catch {
    return null
  }
}

// Save daily usage to localStorage
const saveDailyUsage = (usage: DailyAiUsage): void => {
  if (typeof window === 'undefined') return
  try {
    const data = localStorage.getItem(STORAGE_KEYS.DAILY_USAGE)
    let records: DailyAiUsage[] = data ? JSON.parse(data) : []
    const today = getTodayString()

    // Clean up old records (keep only today's)
    records = records.filter(r => r.date === today)

    // Update or add the current user's record
    const existingIndex = records.findIndex(r => r.userId === usage.userId)
    if (existingIndex >= 0) {
      records[existingIndex] = usage
    } else {
      records.push(usage)
    }

    localStorage.setItem(STORAGE_KEYS.DAILY_USAGE, JSON.stringify(records))
  } catch {
    // Silently fail
  }
}

// Get usage record for a specific draft
export const getDraftUsage = (draftId: string, userId: string): AiUsageRecord | null => {
  const records = getUsageRecords()
  return records.find(r => r.draftId === draftId && r.userId === userId) || null
}

// Check if user can generate for this draft
export interface GenerationCheckResult {
  canGenerate: boolean
  reason?: string
  remainingForDraft: number
  remainingForDay: number
  cooldownRemaining: number // in seconds
}

export const checkCanGenerate = (draftId: string, userId: string): GenerationCheckResult => {
  const draftUsage = getDraftUsage(draftId, userId)
  const dailyUsage = getDailyUsage(userId)

  const now = Date.now()

  // Check cooldown
  const lastGenerated = Math.max(
    draftUsage?.lastGeneratedAt || 0,
    dailyUsage?.lastGeneratedAt || 0
  )
  const cooldownRemaining = Math.max(0, Math.ceil((LIMITS.COOLDOWN_MS - (now - lastGenerated)) / 1000))

  if (cooldownRemaining > 0) {
    return {
      canGenerate: false,
      reason: `잠시만 기다려주세요. ${cooldownRemaining}초 후에 다시 시도할 수 있습니다.`,
      remainingForDraft: LIMITS.MAX_PER_DRAFT - (draftUsage?.generationCount || 0),
      remainingForDay: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
      cooldownRemaining,
    }
  }

  // Check draft limit
  const draftCount = draftUsage?.generationCount || 0
  if (draftCount >= LIMITS.MAX_PER_DRAFT) {
    return {
      canGenerate: false,
      reason: `이 프로젝트는 이미 ${LIMITS.MAX_PER_DRAFT}번 AI 생성을 사용했습니다. 생성된 후보 중에서 선택해주세요.`,
      remainingForDraft: 0,
      remainingForDay: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
      cooldownRemaining: 0,
    }
  }

  // Check daily limit
  const dailyCount = dailyUsage?.count || 0
  if (dailyCount >= LIMITS.MAX_PER_DAY) {
    return {
      canGenerate: false,
      reason: `오늘의 AI 생성 한도(${LIMITS.MAX_PER_DAY}회)를 모두 사용했습니다. 내일 다시 시도해주세요.`,
      remainingForDraft: LIMITS.MAX_PER_DRAFT - draftCount,
      remainingForDay: 0,
      cooldownRemaining: 0,
    }
  }

  return {
    canGenerate: true,
    remainingForDraft: LIMITS.MAX_PER_DRAFT - draftCount,
    remainingForDay: LIMITS.MAX_PER_DAY - dailyCount,
    cooldownRemaining: 0,
  }
}

// Record a generation
export const recordGeneration = (draftId: string, userId: string): void => {
  const now = Date.now()
  const today = getTodayString()

  // Update draft usage
  const records = getUsageRecords()
  const existingIndex = records.findIndex(r => r.draftId === draftId && r.userId === userId)

  if (existingIndex >= 0) {
    records[existingIndex].generationCount += 1
    records[existingIndex].lastGeneratedAt = now
  } else {
    records.push({
      draftId,
      userId,
      generationCount: 1,
      lastGeneratedAt: now,
    })
  }
  saveUsageRecords(records)

  // Update daily usage
  const dailyUsage = getDailyUsage(userId)
  saveDailyUsage({
    userId,
    date: today,
    count: (dailyUsage?.count || 0) + 1,
    lastGeneratedAt: now,
  })
}

// Get remaining generations info for UI display
export const getRemainingGenerations = (draftId: string, userId: string): { draft: number; daily: number } => {
  const draftUsage = getDraftUsage(draftId, userId)
  const dailyUsage = getDailyUsage(userId)

  return {
    draft: LIMITS.MAX_PER_DRAFT - (draftUsage?.generationCount || 0),
    daily: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
  }
}

// Export limits for UI
export const AI_LIMITS = LIMITS
