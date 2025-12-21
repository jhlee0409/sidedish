/**
 * 태그 입력 훅
 *
 * 태그 추가, 삭제, 중복 검사를 처리합니다.
 * Register와 Edit 페이지에서 공통으로 사용됩니다.
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { PROJECT_CONSTRAINTS, FORM_ERROR_MESSAGES } from '@/lib/form-constants'

export interface UseTagInputOptions {
  /** 초기 태그 목록 */
  initialTags?: string[]
  /** 최대 태그 개수 */
  maxTags?: number
  /** 에러 발생 시 콜백 */
  onError?: (error: string) => void
  /** 태그 변경 시 콜백 */
  onChange?: (tags: string[]) => void
}

export interface UseTagInputReturn {
  /** 현재 태그 목록 */
  tags: string[]
  /** 입력 중인 태그 */
  tagInput: string
  /** 입력값 변경 핸들러 */
  setTagInput: (value: string) => void
  /** 키보드 이벤트 핸들러 (Enter로 태그 추가) */
  handleKeyDown: (e: React.KeyboardEvent) => void
  /** 태그 추가 */
  addTag: (tag?: string) => boolean
  /** 태그 삭제 */
  removeTag: (tag: string) => void
  /** 태그 목록 직접 설정 */
  setTags: (tags: string[]) => void
  /** 초기화 */
  reset: () => void
  /** 태그 추가 가능 여부 */
  canAddMore: boolean
  /** 남은 태그 개수 */
  remainingCount: number
}

export function useTagInput(options: UseTagInputOptions = {}): UseTagInputReturn {
  const {
    initialTags = [],
    maxTags = PROJECT_CONSTRAINTS.MAX_TAGS,
    onError,
    onChange,
  } = options

  const [tags, setTagsInternal] = useState<string[]>(initialTags)
  const [tagInput, setTagInput] = useState('')

  const handleError = useCallback((message: string) => {
    if (onError) {
      onError(message)
    } else {
      toast.error(message)
    }
  }, [onError])

  const setTags = useCallback((newTags: string[]) => {
    setTagsInternal(newTags)
    onChange?.(newTags)
  }, [onChange])

  const addTag = useCallback((tag?: string): boolean => {
    const tagToAdd = (tag || tagInput).trim()

    if (!tagToAdd) return false

    // 최대 개수 체크
    if (tags.length >= maxTags) {
      handleError(FORM_ERROR_MESSAGES.MAX_TAGS_REACHED)
      return false
    }

    // 중복 체크
    if (tags.includes(tagToAdd)) {
      handleError('이미 추가된 태그입니다.')
      return false
    }

    // 길이 체크
    if (tagToAdd.length > PROJECT_CONSTRAINTS.TAG_MAX_LENGTH) {
      handleError(`태그는 최대 ${PROJECT_CONSTRAINTS.TAG_MAX_LENGTH}자까지 입력 가능합니다.`)
      return false
    }

    const newTags = [...tags, tagToAdd]
    setTags(newTags)
    setTagInput('')
    return true
  }, [tags, tagInput, maxTags, handleError, setTags])

  const removeTag = useCallback((tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
  }, [tags, setTags])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }, [addTag])

  const reset = useCallback(() => {
    setTagsInternal(initialTags)
    setTagInput('')
  }, [initialTags])

  return {
    tags,
    tagInput,
    setTagInput,
    handleKeyDown,
    addTag,
    removeTag,
    setTags,
    reset,
    canAddMore: tags.length < maxTags,
    remainingCount: maxTags - tags.length,
  }
}

export default useTagInput
