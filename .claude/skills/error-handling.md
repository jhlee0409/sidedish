---
name: error-handling-patterns
description: 일관된 에러 처리와 로깅 패턴을 구현합니다. API 에러 응답, 예외 처리, 에러 바운더리, 사용자 친화적 메시지 작성 시 사용하세요. 서버와 클라이언트 양쪽의 에러 처리 전략을 포함합니다.
allowed-tools: Read, Glob, Grep
---

# Error Handling Skill

## Overview

일관된 에러 처리는 디버깅 용이성, 사용자 경험, 보안을 위해 중요합니다. SideDish는 서버(API Routes)와 클라이언트(React) 양쪽에서 체계적인 에러 처리를 적용합니다.

## HTTP Status Code Convention

### Success (2xx)

| Code | Name | Use Case | Example |
|------|------|----------|---------|
| 200 | OK | 성공적인 조회/수정 | GET, PATCH 성공 |
| 201 | Created | 리소스 생성 성공 | POST 생성 |
| 204 | No Content | 성공했지만 반환값 없음 | DELETE 성공 |

### Client Error (4xx)

| Code | Name | Use Case | Korean Message |
|------|------|----------|----------------|
| 400 | Bad Request | 잘못된 입력 | 입력 정보를 확인해주세요. |
| 401 | Unauthorized | 인증 필요/실패 | 인증이 필요합니다. / 로그인이 필요합니다. |
| 403 | Forbidden | 권한 없음 | 권한이 없습니다. |
| 404 | Not Found | 리소스 없음 | 찾을 수 없습니다. |
| 409 | Conflict | 중복/충돌 | 이미 존재합니다. |
| 422 | Unprocessable | 검증 실패 | 입력 형식이 올바르지 않습니다. |
| 429 | Too Many Requests | 요청 초과 | 요청이 너무 많습니다. 잠시 후 다시 시도해주세요. |

### Server Error (5xx)

| Code | Name | Use Case | Korean Message |
|------|------|----------|----------------|
| 500 | Internal Server Error | 서버 오류 | 서버 오류가 발생했습니다. |
| 502 | Bad Gateway | 외부 서비스 오류 | 외부 서비스 연결에 실패했습니다. |
| 503 | Service Unavailable | 서비스 불가 | 서비스를 일시적으로 사용할 수 없습니다. |

## Server-Side Error Handling

### Standard API Route Pattern

```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    // 2. Authentication
    // 3. Validation
    // 4. Business logic
    // 5. Success response
    return NextResponse.json(result, { status: 201 })

  } catch (error) {
    // 에러 로깅 (상세 정보는 서버에서만)
    console.error('[API] POST /api/endpoint error:', error)

    // 알려진 에러 타입 처리
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error instanceof AuthenticationError) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 예상치 못한 에러 - 사용자에게는 일반 메시지
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

### Error Response Helper Functions

```typescript
// src/lib/api-response.ts

import { NextResponse } from 'next/server'

// 에러 응답 타입
interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, string>
}

// 기본 에러 응답
export function errorResponse(
  message: string,
  status: number,
  options?: { code?: string; details?: Record<string, string> }
): NextResponse<ErrorResponse> {
  const body: ErrorResponse = { error: message }
  if (options?.code) body.code = options.code
  if (options?.details) body.details = options.details
  return NextResponse.json(body, { status })
}

// 편의 함수들
export const badRequest = (message: string, details?: Record<string, string>) =>
  errorResponse(message, 400, { details })

export const unauthorized = () =>
  errorResponse('인증이 필요합니다.', 401)

export const forbidden = () =>
  errorResponse('권한이 없습니다.', 403)

export const notFound = (resource = '리소스') =>
  errorResponse(`${resource}을(를) 찾을 수 없습니다.`, 404)

export const conflict = (message: string) =>
  errorResponse(message, 409)

export const tooManyRequests = () =>
  errorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 429)

export const internalError = () =>
  errorResponse('서버 오류가 발생했습니다.', 500)
```

### Validation Error Pattern

```typescript
import { validateString, CONTENT_LIMITS } from '@/lib/security-utils'

export async function POST(request: NextRequest) {
  const body = await request.json()

  // 개별 필드 검증
  const errors: Record<string, string> = {}

  const titleResult = validateString(body.title, '제목', {
    required: true,
    maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
  })
  if (!titleResult.valid) errors.title = titleResult.error!

  const descResult = validateString(body.description, '설명', {
    required: true,
    maxLength: CONTENT_LIMITS.PROJECT_DESC_MAX,
  })
  if (!descResult.valid) errors.description = descResult.error!

  // 에러가 있으면 상세 정보와 함께 반환
  if (Object.keys(errors).length > 0) {
    return badRequest('입력 정보를 확인해주세요.', errors)
  }

  // 정상 진행...
}
```

### Logging Best Practices

```typescript
// 1. 에러 위치 명시
console.error('[API] GET /api/projects error:', error)
console.error('[Service] generateContent error:', error)
console.error('[DB] Firestore write error:', error)

// 2. 구조화된 로깅 (필요시)
console.error(JSON.stringify({
  type: 'API_ERROR',
  endpoint: '/api/projects',
  method: 'POST',
  userId: authUser?.uid,
  error: error instanceof Error ? error.message : String(error),
  stack: error instanceof Error ? error.stack : undefined,
  timestamp: new Date().toISOString(),
}))

// 3. 민감 정보 제외
// ❌ Bad
console.error('Auth failed for token:', authToken)

// ✅ Good
console.error('Auth failed for user:', userId)
```

## Client-Side Error Handling

### API Client Error Class

```typescript
// src/lib/api-client.ts

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: Record<string, string>
  ) {
    super(message)
    this.name = 'ApiError'
  }

  isUnauthorized(): boolean {
    return this.status === 401
  }

  isForbidden(): boolean {
    return this.status === 403
  }

  isNotFound(): boolean {
    return this.status === 404
  }

  isRateLimited(): boolean {
    return this.status === 429
  }
}
```

### Fetch Wrapper with Error Handling

```typescript
// src/lib/api-client.ts

async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = await getIdToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new ApiError(
      response.status,
      errorBody.error || '요청 처리 중 오류가 발생했습니다.',
      errorBody.details
    )
  }

  return response
}
```

### Component Error Handling Pattern

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createProject } from '@/lib/api-client'
import { ApiError } from '@/lib/api-client'

function ProjectForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true)
    setErrors({})

    try {
      await createProject(data)
      toast.success('프로젝트가 등록되었습니다!')
      router.push('/dashboard')

    } catch (error) {
      if (error instanceof ApiError) {
        // 검증 에러: 필드별 표시
        if (error.details) {
          setErrors(error.details)
          return
        }

        // 인증 에러: 로그인 유도
        if (error.isUnauthorized()) {
          toast.error('로그인이 필요합니다.')
          router.push('/login')
          return
        }

        // Rate limit: 재시도 안내
        if (error.isRateLimited()) {
          toast.error('잠시 후 다시 시도해주세요.')
          return
        }

        // 기타 API 에러
        toast.error(error.message)

      } else {
        // 네트워크 에러 등
        toast.error('네트워크 오류가 발생했습니다.')
        console.error('Submit error:', error)
      }

    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="title"
        className={errors.title ? 'border-red-500' : ''}
      />
      {errors.title && (
        <p className="text-red-500 text-sm">{errors.title}</p>
      )}
      {/* ... */}
    </form>
  )
}
```

### Error Boundary Pattern

```tsx
// src/components/ErrorBoundary.tsx
'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
    // 에러 리포팅 서비스로 전송 (Sentry 등)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">
            문제가 발생했습니다
          </h2>
          <p className="text-slate-600 mb-4">
            페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg"
          >
            다시 시도
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// 사용
<ErrorBoundary fallback={<ProjectErrorFallback />}>
  <ProjectDetail />
</ErrorBoundary>
```

## Toast Notification Pattern

```tsx
// src/lib/toast-helpers.ts
import { toast } from 'sonner'

export const showSuccess = (message: string) => {
  toast.success(message)
}

export const showError = (message: string) => {
  toast.error(message)
}

export const showApiError = (error: unknown) => {
  if (error instanceof ApiError) {
    toast.error(error.message)
  } else {
    toast.error('오류가 발생했습니다.')
  }
}

// 사용자 액션에 대한 결과 표시
export const showActionResult = async <T,>(
  action: () => Promise<T>,
  messages: {
    loading?: string
    success: string
    error?: string
  }
): Promise<T | undefined> => {
  try {
    const result = await action()
    toast.success(messages.success)
    return result
  } catch (error) {
    showApiError(error)
    return undefined
  }
}

// 사용 예
const handleDelete = () => {
  showActionResult(
    () => deleteProject(projectId),
    { success: '프로젝트가 삭제되었습니다.' }
  )
}
```

## Retry Pattern

```typescript
// src/lib/retry.ts

interface RetryOptions {
  maxRetries?: number
  delayMs?: number
  backoff?: boolean
  shouldRetry?: (error: unknown) => boolean
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoff = true,
    shouldRetry = (error) => {
      // 네트워크 에러나 5xx만 재시도
      if (error instanceof ApiError) {
        return error.status >= 500 || error.status === 429
      }
      return error instanceof TypeError // fetch 실패
    },
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error
      }

      const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// 사용
const data = await withRetry(
  () => fetchWithAuth('/api/projects'),
  { maxRetries: 3, backoff: true }
)
```

## Error Messages Convention

### Korean Error Messages

```typescript
// 메시지 일관성을 위한 상수
export const ERROR_MESSAGES = {
  // 인증
  AUTH_REQUIRED: '로그인이 필요합니다.',
  AUTH_FAILED: '인증에 실패했습니다.',
  SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해주세요.',

  // 권한
  FORBIDDEN: '권한이 없습니다.',
  OWNER_ONLY: '작성자만 수정할 수 있습니다.',

  // 검증
  INVALID_INPUT: '입력 정보를 확인해주세요.',
  REQUIRED_FIELD: '필수 항목입니다.',
  TOO_LONG: (field: string, max: number) =>
    `${field}은(는) ${max}자 이하로 입력해주세요.`,
  INVALID_FORMAT: '올바른 형식이 아닙니다.',
  INVALID_URL: '올바른 URL을 입력해주세요.',

  // 리소스
  NOT_FOUND: '찾을 수 없습니다.',
  PROJECT_NOT_FOUND: '프로젝트를 찾을 수 없습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  ALREADY_EXISTS: '이미 존재합니다.',

  // Rate limit
  RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',

  // 서버
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  TRY_AGAIN: '잠시 후 다시 시도해주세요.',

  // 업로드
  FILE_TOO_LARGE: '파일 크기는 5MB 이하여야 합니다.',
  INVALID_FILE_TYPE: '허용되지 않는 파일 형식입니다.',
  UPLOAD_FAILED: '파일 업로드에 실패했습니다.',

  // AI
  AI_GENERATION_FAILED: 'AI 생성에 실패했습니다.',
  AI_LIMIT_EXCEEDED: 'AI 사용 한도를 초과했습니다.',
} as const
```

## Error Tracking Preparation

```typescript
// src/lib/error-tracking.ts
// 향후 Sentry 등 연동을 위한 인터페이스

interface ErrorContext {
  userId?: string
  route?: string
  action?: string
  extra?: Record<string, unknown>
}

export function captureError(
  error: Error,
  context?: ErrorContext
): void {
  // 개발 환경: 콘솔 출력
  console.error('[Error]', {
    message: error.message,
    stack: error.stack,
    ...context,
  })

  // TODO: 프로덕션에서 Sentry 연동
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, { extra: context })
  // }
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  console.log(`[${level.toUpperCase()}]`, message, context)

  // TODO: Sentry 연동
  // Sentry.captureMessage(message, level)
}
```

## Checklist

### API Route Error Handling

- [ ] try-catch로 전체 핸들러 감싸기
- [ ] 적절한 HTTP 상태 코드 사용
- [ ] 한국어 사용자 친화적 메시지
- [ ] 서버 로그에 상세 에러 기록
- [ ] 민감 정보 노출 방지

### Client Error Handling

- [ ] ApiError 클래스로 에러 타입 구분
- [ ] 검증 에러는 필드별 표시
- [ ] 네트워크 에러 별도 처리
- [ ] toast로 사용자 피드백
- [ ] 에러 발생 시 적절한 UI 상태

### Error UX

- [ ] 에러 메시지가 이해하기 쉬운가?
- [ ] 사용자가 다음 액션을 알 수 있는가?
- [ ] 재시도 옵션이 제공되는가?
- [ ] 심각한 에러는 폴백 UI가 있는가?
