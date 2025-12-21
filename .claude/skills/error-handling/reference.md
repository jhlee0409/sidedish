# Error Handling Reference

## HTTP Status Code Convention

### Success (2xx)
| Code | Name | Use Case |
|------|------|----------|
| 200 | OK | 성공적인 조회/수정 |
| 201 | Created | 리소스 생성 성공 |
| 204 | No Content | DELETE 성공 |

### Client Error (4xx)
| Code | Name | Korean Message |
|------|------|----------------|
| 400 | Bad Request | 입력 정보를 확인해주세요. |
| 401 | Unauthorized | 인증이 필요합니다. |
| 403 | Forbidden | 권한이 없습니다. |
| 404 | Not Found | 찾을 수 없습니다. |
| 409 | Conflict | 이미 존재합니다. |
| 422 | Unprocessable | 입력 형식이 올바르지 않습니다. |
| 429 | Too Many Requests | 요청이 너무 많습니다. |

### Server Error (5xx)
| Code | Name | Korean Message |
|------|------|----------------|
| 500 | Internal Server Error | 서버 오류가 발생했습니다. |
| 502 | Bad Gateway | 외부 서비스 연결에 실패했습니다. |
| 503 | Service Unavailable | 서비스를 일시적으로 사용할 수 없습니다. |

## Server-Side Pattern

```typescript
export async function POST(request: NextRequest) {
  try {
    // Processing logic
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[API] POST /api/endpoint error:', error)

    if (error instanceof ValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
```

## Validation Error Pattern

```typescript
const errors: Record<string, string> = {}

const titleResult = validateString(body.title, '제목', { required: true })
if (!titleResult.valid) errors.title = titleResult.error!

const descResult = validateString(body.description, '설명', { required: true })
if (!descResult.valid) errors.description = descResult.error!

if (Object.keys(errors).length > 0) {
  return NextResponse.json({
    error: '입력 정보를 확인해주세요.',
    details: errors,
  }, { status: 400 })
}
```

## Client-Side API Error Class

```typescript
export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: Record<string, string>
  ) {
    super(message)
  }

  isUnauthorized() { return this.status === 401 }
  isForbidden() { return this.status === 403 }
  isNotFound() { return this.status === 404 }
  isRateLimited() { return this.status === 429 }
}
```

## Component Error Handling

```tsx
const handleSubmit = async (data: FormData) => {
  setIsLoading(true)
  setErrors({})

  try {
    await createProject(data)
    toast.success('프로젝트가 등록되었습니다!')
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.details) {
        setErrors(error.details)
        return
      }
      if (error.isUnauthorized()) {
        toast.error('로그인이 필요합니다.')
        router.push('/login')
        return
      }
      if (error.isRateLimited()) {
        toast.error('잠시 후 다시 시도해주세요.')
        return
      }
      toast.error(error.message)
    } else {
      toast.error('네트워크 오류가 발생했습니다.')
    }
  } finally {
    setIsLoading(false)
  }
}
```

## Error Boundary

```tsx
export class ErrorBoundary extends Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-center p-6">
          <h2>문제가 발생했습니다</h2>
          <button onClick={() => this.setState({ hasError: false })}>
            다시 시도
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

## Toast Notification

```tsx
import { toast } from 'sonner'

toast.success('저장되었습니다!')
toast.error('오류가 발생했습니다.')
toast.info('알림 메시지')
```

## Retry Pattern

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000 } = options
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, attempt)))
      }
    }
  }
  throw lastError
}
```

## Error Messages Constant

```typescript
export const ERROR_MESSAGES = {
  AUTH_REQUIRED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '찾을 수 없습니다.',
  RATE_LIMITED: '요청이 너무 많습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다.',
  INVALID_INPUT: '입력 정보를 확인해주세요.',
  FILE_TOO_LARGE: '파일 크기는 5MB 이하여야 합니다.',
  AI_GENERATION_FAILED: 'AI 생성에 실패했습니다.',
} as const
```
