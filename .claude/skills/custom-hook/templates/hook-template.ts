/**
 * [훅 이름] 훅
 *
 * [훅의 목적과 기능 설명]
 * [어디서 사용되는지 설명]
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
// import { PROJECT_CONSTRAINTS, FORM_ERROR_MESSAGES } from '@/lib/form-constants'
// import { ApiError } from '@/lib/api-client'

// ============================================================
// Types
// ============================================================

export interface UseHookNameOptions {
  /** 초기값 */
  initialValue?: string
  /** 에러 발생 시 콜백 (미지정 시 toast.error 사용) */
  onError?: (error: string) => void
  /** 값 변경 시 콜백 */
  onChange?: (value: string) => void
}

export interface UseHookNameReturn {
  /** 현재 값 */
  value: string
  /** 값 변경 핸들러 */
  setValue: (value: string) => void
  /** 상태 초기화 */
  reset: () => void
  /** 유효성 여부 */
  isValid: boolean
}

// ============================================================
// Hook Implementation
// ============================================================

export function useHookName(options: UseHookNameOptions = {}): UseHookNameReturn {
  const {
    initialValue = '',
    onError,
    onChange,
  } = options

  // State
  const [value, setValueInternal] = useState(initialValue)

  // Error handler (with fallback to toast)
  const handleError = useCallback((message: string) => {
    if (onError) {
      onError(message)
    } else {
      toast.error(message)
    }
  }, [onError])

  // Memoized handlers
  const setValue = useCallback((newValue: string) => {
    // Add validation logic here if needed
    // if (!isValidValue(newValue)) {
    //   handleError('유효하지 않은 값입니다.')
    //   return
    // }

    setValueInternal(newValue)
    onChange?.(newValue)
  }, [onChange])

  const reset = useCallback(() => {
    setValueInternal(initialValue)
  }, [initialValue])

  // Derived state
  const isValid = value.length > 0

  // ============================================================
  // Return
  // ============================================================

  return {
    value,
    setValue,
    reset,
    isValid,
  }
}

export default useHookName
