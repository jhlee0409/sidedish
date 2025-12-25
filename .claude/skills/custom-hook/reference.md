# Custom Hook Reference

## Advanced Patterns

### 1. API Fetching Hook

```typescript
/**
 * 데이터 조회 훅
 *
 * API에서 데이터를 가져오고 캐싱, 로딩, 에러 상태를 관리합니다.
 */

import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-client'

export interface UseFetchOptions<T> {
  /** 초기 데이터 */
  initialData?: T
  /** 자동 fetch 여부 (기본: true) */
  autoFetch?: boolean
  /** 에러 콜백 */
  onError?: (error: string) => void
  /** 성공 콜백 */
  onSuccess?: (data: T) => void
}

export interface UseFetchReturn<T> {
  /** 데이터 */
  data: T | undefined
  /** 로딩 상태 */
  isLoading: boolean
  /** 에러 메시지 */
  error: string | null
  /** 수동 refetch */
  refetch: () => Promise<void>
  /** 로딩 완료 여부 */
  isReady: boolean
}

export function useFetch<T>(
  fetcher: () => Promise<T>,
  options: UseFetchOptions<T> = {}
): UseFetchReturn<T> {
  const { initialData, autoFetch = true, onError, onSuccess } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [isLoading, setIsLoading] = useState(autoFetch)
  const [error, setError] = useState<string | null>(null)

  const handleError = useCallback((message: string) => {
    setError(message)
    onError ? onError(message) : toast.error(message)
  }, [onError])

  const fetch = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      setData(result)
      onSuccess?.(result)
    } catch (err) {
      const message = err instanceof ApiError
        ? err.message
        : '데이터를 불러오는데 실패했습니다.'
      handleError(message)
    } finally {
      setIsLoading(false)
    }
  }, [fetcher, handleError, onSuccess])

  useEffect(() => {
    if (autoFetch) {
      fetch()
    }
  }, []) // 의도적으로 fetch를 의존성에서 제외

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
    isReady: !isLoading && !error,
  }
}
```

### 2. Form State Hook

```typescript
/**
 * 폼 상태 관리 훅
 *
 * 입력값 추적, 유효성 검사, 제출 상태를 관리합니다.
 */

import { useState, useCallback, useMemo } from 'react'
import { toast } from 'sonner'

export interface UseFormStateOptions<T extends Record<string, unknown>> {
  initialValues: T
  validate?: (values: T) => Partial<Record<keyof T, string>>
  onSubmit?: (values: T) => Promise<void>
}

export interface UseFormStateReturn<T extends Record<string, unknown>> {
  values: T
  errors: Partial<Record<keyof T, string>>
  touched: Partial<Record<keyof T, boolean>>
  isSubmitting: boolean
  isValid: boolean
  isDirty: boolean
  setValue: <K extends keyof T>(field: K, value: T[K]) => void
  setTouched: (field: keyof T) => void
  handleSubmit: (e?: React.FormEvent) => Promise<void>
  reset: () => void
}

export function useFormState<T extends Record<string, unknown>>(
  options: UseFormStateOptions<T>
): UseFormStateReturn<T> {
  const { initialValues, validate, onSubmit } = options

  const [values, setValues] = useState<T>(initialValues)
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const errors = useMemo(() => {
    return validate ? validate(values) : {}
  }, [values, validate])

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0
  }, [errors])

  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues)
  }, [values, initialValues])

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }))
  }, [])

  const setFieldTouched = useCallback((field: keyof T) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()

    if (!isValid || !onSubmit) {
      toast.error('입력 내용을 확인해주세요.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(values)
    } catch (error) {
      toast.error('제출에 실패했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [values, isValid, onSubmit])

  const reset = useCallback(() => {
    setValues(initialValues)
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    isDirty,
    setValue,
    setTouched: setFieldTouched,
    handleSubmit,
    reset,
  }
}
```

### 3. Toggle/Boolean Hook

```typescript
/**
 * 토글 상태 훅
 *
 * boolean 상태를 간편하게 관리합니다.
 */

import { useState, useCallback } from 'react'

export interface UseToggleReturn {
  value: boolean
  toggle: () => void
  setTrue: () => void
  setFalse: () => void
  setValue: (value: boolean) => void
}

export function useToggle(initialValue = false): UseToggleReturn {
  const [value, setValue] = useState(initialValue)

  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])

  return { value, toggle, setTrue, setFalse, setValue }
}
```

### 4. Debounced Value Hook

```typescript
/**
 * 디바운스 값 훅
 *
 * 입력값의 디바운스를 처리합니다.
 * 검색 입력 등에 활용합니다.
 */

import { useState, useEffect } from 'react'
import { FORM_TIMING } from '@/lib/form-constants'

export interface UseDebounceOptions {
  delay?: number
}

export function useDebounce<T>(
  value: T,
  options: UseDebounceOptions = {}
): T {
  const { delay = FORM_TIMING.SEARCH_DEBOUNCE_MS } = options
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
```

### 5. LocalStorage Hook

```typescript
/**
 * LocalStorage 동기화 훅
 *
 * 상태를 localStorage와 자동 동기화합니다.
 */

import { useState, useCallback, useEffect } from 'react'

export interface UseLocalStorageOptions<T> {
  serializer?: (value: T) => string
  deserializer?: (value: string) => T
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options: UseLocalStorageOptions<T> = {}
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const {
    serializer = JSON.stringify,
    deserializer = JSON.parse,
  } = options

  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? deserializer(item) : initialValue
    } catch {
      return initialValue
    }
  })

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, serializer(valueToStore))
      }

      return valueToStore
    })
  }, [key, serializer])

  const removeValue = useCallback(() => {
    setStoredValue(initialValue)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key)
    }
  }, [key, initialValue])

  return [storedValue, setValue, removeValue]
}
```

## Project-Specific Integrations

### With form-constants.ts

```typescript
import {
  PROJECT_CONSTRAINTS,
  FILE_CONSTRAINTS,
  AI_CONSTRAINTS,
  FORM_TIMING,
  FORM_ERROR_MESSAGES,
} from '@/lib/form-constants'

// 예: 제한 체크
if (value.length > PROJECT_CONSTRAINTS.TITLE_MAX_LENGTH) {
  handleError(FORM_ERROR_MESSAGES.TITLE_TOO_LONG)
}
```

### With API Client

```typescript
import { ApiError, getProjects, createProject } from '@/lib/api-client'

// 예: API 에러 처리
try {
  await createProject(data)
} catch (error) {
  if (error instanceof ApiError) {
    handleError(error.message) // 서버에서 온 한국어 에러 메시지
  } else {
    handleError('알 수 없는 오류가 발생했습니다.')
  }
}
```

### With Auth Context

```typescript
import { useAuth } from '@/contexts/AuthContext'

export function useProtectedAction() {
  const { isAuthenticated, getIdToken } = useAuth()

  const performAction = useCallback(async () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.')
      return
    }

    const token = await getIdToken()
    // ... use token
  }, [isAuthenticated, getIdToken])

  return { performAction }
}
```

## Testing Hooks

```typescript
// src/__tests__/hooks/useHookName.test.ts
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { useHookName } from '@/hooks/useHookName'

describe('useHookName', () => {
  it('should initialize with default value', () => {
    const { result } = renderHook(() => useHookName())

    expect(result.current.value).toBe('')
    expect(result.current.isValid).toBe(false)
  })

  it('should update value', () => {
    const { result } = renderHook(() => useHookName())

    act(() => {
      result.current.setValue('test')
    })

    expect(result.current.value).toBe('test')
    expect(result.current.isValid).toBe(true)
  })

  it('should call onChange callback', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() =>
      useHookName({ onChange })
    )

    act(() => {
      result.current.setValue('test')
    })

    expect(onChange).toHaveBeenCalledWith('test')
  })

  it('should reset to initial value', () => {
    const { result } = renderHook(() =>
      useHookName({ initialValue: 'initial' })
    )

    act(() => {
      result.current.setValue('changed')
      result.current.reset()
    })

    expect(result.current.value).toBe('initial')
  })
})
```

## Common Mistakes to Avoid

### 1. Missing useCallback
```typescript
// ❌ Bad - 매 렌더링마다 새 함수 생성
const handleChange = (value: string) => setValue(value)

// ✅ Good - 메모이제이션
const handleChange = useCallback((value: string) => {
  setValue(value)
}, [setValue])
```

### 2. Stale Closure
```typescript
// ❌ Bad - options가 변경되어도 반영 안됨
useEffect(() => {
  options.onMount?.()
}, [])

// ✅ Good - 의존성 명시
useEffect(() => {
  options.onMount?.()
}, [options.onMount])
```

### 3. Direct State Mutation
```typescript
// ❌ Bad - 직접 변경
items.push(newItem)
setItems(items)

// ✅ Good - 불변성 유지
setItems([...items, newItem])
```

### 4. Missing Type Export
```typescript
// ❌ Bad - 타입만 export 누락
export function useHookName() { ... }

// ✅ Good - 타입도 export
export interface UseHookNameOptions { ... }
export interface UseHookNameReturn { ... }
export function useHookName() { ... }
```
