/**
 * AI 콘텐츠 생성 훅
 *
 * Gemini AI를 사용한 프로젝트 설명 생성을 관리합니다.
 * 사용량 제한, 쿨다운, 후보자 관리를 포함합니다.
 */

import { useState, useCallback, useEffect } from 'react'
import { generateAiContent, getAiUsageInfo, ApiError } from '@/lib/api-client'
import { AiGenerationCandidate, AiGeneratedContent } from '@/lib/types'
import { AI_CONSTRAINTS, FORM_ERROR_MESSAGES, FORM_TIMING } from '@/lib/form-constants'

// 고유 ID 생성
const generateCandidateId = (): string => {
  return `candidate_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

export interface AiLimitInfo {
  remainingForDraft: number
  remainingForDay: number
  maxPerDraft: number
  maxPerDay: number
  cooldownRemaining: number
}

export interface AiGenerationResult {
  shortDescription: string
  description: string
  tags: string[]
  candidate: AiGenerationCandidate
}

export interface UseAiGenerationOptions {
  /** Draft 또는 Project ID */
  draftId: string | null
  /** 생성에 사용할 설명 텍스트 */
  description: string
  /** 기존 후보자 목록 (편집 모드) */
  initialCandidates?: AiGenerationCandidate[]
  /** 선택된 후보자 ID (편집 모드) */
  initialSelectedId?: string | null
  /** 성공 콜백 */
  onSuccess?: (result: AiGenerationResult) => void
  /** 에러 콜백 */
  onError?: (error: string) => void
}

export interface UseAiGenerationReturn {
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 사용량 정보 */
  limitInfo: AiLimitInfo
  /** 후보자 목록 */
  candidates: AiGenerationCandidate[]
  /** 선택된 후보자 ID */
  selectedCandidateId: string | null
  /** AI 생성 실행 */
  generate: () => Promise<AiGenerationResult | null>
  /** 후보자 선택 */
  selectCandidate: (candidateId: string) => AiGeneratedContent | null
  /** 에러 초기화 */
  clearError: () => void
  /** 생성 가능 여부 */
  canGenerate: boolean
  /** 쿨다운 활성화 여부 */
  isOnCooldown: boolean
  /** 설명이 충분한지 여부 */
  hasEnoughDescription: boolean
}

export function useAiGeneration(options: UseAiGenerationOptions): UseAiGenerationReturn {
  const {
    draftId,
    description,
    initialCandidates = [],
    initialSelectedId = null,
    onSuccess,
    onError,
  } = options

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [candidates, setCandidates] = useState<AiGenerationCandidate[]>(initialCandidates)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(initialSelectedId)
  const [limitInfo, setLimitInfo] = useState<AiLimitInfo>({
    remainingForDraft: AI_CONSTRAINTS.MAX_PER_DRAFT,
    remainingForDay: AI_CONSTRAINTS.MAX_PER_DAY,
    maxPerDraft: AI_CONSTRAINTS.MAX_PER_DRAFT,
    maxPerDay: AI_CONSTRAINTS.MAX_PER_DAY,
    cooldownRemaining: 0,
  })

  // 사용량 정보 로드
  useEffect(() => {
    if (!draftId) return

    getAiUsageInfo(draftId)
      .then(usage => {
        setLimitInfo(prev => ({
          ...prev,
          remainingForDraft: usage.remainingForDraft,
          remainingForDay: usage.remainingForDay,
          maxPerDraft: usage.maxPerDraft,
          maxPerDay: usage.maxPerDay,
        }))
      })
      .catch(err => {
        console.error('Failed to fetch AI usage info:', err)
      })
  }, [draftId])

  // 쿨다운 타이머
  useEffect(() => {
    if (limitInfo.cooldownRemaining <= 0) return

    const timer = setInterval(() => {
      setLimitInfo(prev => ({
        ...prev,
        cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1),
      }))
    }, FORM_TIMING.COOLDOWN_CHECK_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [limitInfo.cooldownRemaining])

  // 초기 후보자 동기화
  useEffect(() => {
    if (initialCandidates.length > 0) {
      setCandidates(initialCandidates)
    }
  }, [initialCandidates])

  useEffect(() => {
    if (initialSelectedId !== undefined) {
      setSelectedCandidateId(initialSelectedId)
    }
  }, [initialSelectedId])

  const hasEnoughDescription = description.length >= AI_CONSTRAINTS.MIN_DESC_LENGTH
  const isOnCooldown = limitInfo.cooldownRemaining > 0
  const canGenerate =
    !!draftId &&
    hasEnoughDescription &&
    limitInfo.remainingForDraft > 0 &&
    limitInfo.remainingForDay > 0 &&
    !isOnCooldown &&
    !isLoading

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const generate = useCallback(async (): Promise<AiGenerationResult | null> => {
    if (!draftId) {
      setError('Draft ID가 필요합니다.')
      return null
    }

    setError(null)

    // 설명 길이 검증
    if (!hasEnoughDescription) {
      const errorMsg = FORM_ERROR_MESSAGES.AI_DESC_TOO_SHORT(
        AI_CONSTRAINTS.MIN_DESC_LENGTH,
        description.length
      )
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }

    // Draft 한도 검증
    if (limitInfo.remainingForDraft <= 0) {
      const errorMsg = FORM_ERROR_MESSAGES.AI_LIMIT_DRAFT(limitInfo.maxPerDraft)
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }

    // 일일 한도 검증
    if (limitInfo.remainingForDay <= 0) {
      const errorMsg = FORM_ERROR_MESSAGES.AI_LIMIT_DAY(limitInfo.maxPerDay)
      setError(errorMsg)
      onError?.(errorMsg)
      return null
    }

    setIsLoading(true)

    try {
      const result = await generateAiContent(draftId, description)

      // 새 후보자 생성
      const newCandidate: AiGenerationCandidate = {
        id: generateCandidateId(),
        content: {
          shortDescription: result.shortDescription,
          description: result.description,
          tags: result.tags,
          generatedAt: result.generatedAt,
        },
        isSelected: true,
      }

      // 기존 후보자들 선택 해제 후 새 후보자 추가
      const updatedCandidates = candidates.map(c => ({ ...c, isSelected: false }))
      updatedCandidates.push(newCandidate)

      setCandidates(updatedCandidates)
      setSelectedCandidateId(newCandidate.id)

      // 사용량 정보 업데이트
      setLimitInfo(prev => ({
        ...prev,
        remainingForDraft: result.usage.remainingForDraft,
        remainingForDay: result.usage.remainingForDay,
        maxPerDraft: result.usage.maxPerDraft,
        maxPerDay: result.usage.maxPerDay,
        cooldownRemaining: AI_CONSTRAINTS.COOLDOWN_SECONDS,
      }))

      const generationResult: AiGenerationResult = {
        shortDescription: result.shortDescription,
        description: result.description,
        tags: result.tags,
        candidate: newCandidate,
      }

      onSuccess?.(generationResult)
      return generationResult

    } catch (err) {
      console.error('AI generation error:', err)

      let errorMsg: string = FORM_ERROR_MESSAGES.AI_GENERATION_FAILED
      if (err instanceof ApiError) {
        errorMsg = err.message

        // 429 에러 시 사용량 정보 다시 로드
        if (err.status === 429 && draftId) {
          getAiUsageInfo(draftId)
            .then(usage => {
              setLimitInfo(prev => ({
                ...prev,
                remainingForDraft: usage.remainingForDraft,
                remainingForDay: usage.remainingForDay,
              }))
            })
            .catch(() => {})
        }
      }

      setError(errorMsg)
      onError?.(errorMsg)
      return null

    } finally {
      setIsLoading(false)
    }
  }, [
    draftId,
    description,
    hasEnoughDescription,
    limitInfo,
    candidates,
    onSuccess,
    onError,
  ])

  const selectCandidate = useCallback((candidateId: string): AiGeneratedContent | null => {
    const candidate = candidates.find(c => c.id === candidateId)
    if (!candidate) return null

    // 선택 상태 업데이트
    const updatedCandidates = candidates.map(c => ({
      ...c,
      isSelected: c.id === candidateId,
    }))

    setCandidates(updatedCandidates)
    setSelectedCandidateId(candidateId)

    return candidate.content
  }, [candidates])

  return {
    isLoading,
    error,
    limitInfo,
    candidates,
    selectedCandidateId,
    generate,
    selectCandidate,
    clearError,
    canGenerate,
    isOnCooldown,
    hasEnoughDescription,
  }
}

export default useAiGeneration
