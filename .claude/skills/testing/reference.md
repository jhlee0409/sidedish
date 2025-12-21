# Testing Reference

## Test File Structure

```
src/__tests__/
├── setup.ts                   # Global test setup
├── helpers/
│   └── mock-firebase.ts       # Firebase mocking
├── security-utils.test.ts
├── sanitize-utils.test.ts
├── rate-limiter.test.ts
└── api/
    └── projects.test.ts
```

## Unit Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('functionName', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should do something when condition', () => {
    const result = functionName('input')
    expect(result).toBe('expected')
  })

  it('should handle edge case', () => {
    expect(functionName('')).toBeNull()
  })

  it('should throw error for invalid input', () => {
    expect(() => functionName(null)).toThrow('Error message')
  })
})
```

## Mocking

### Mock Functions
```typescript
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))

expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)
```

### Mock Modules
```typescript
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => mockDb),
}))

vi.mock('@/services/geminiService', () => ({
  generateProjectContent: vi.fn().mockResolvedValue({
    shortDescription: 'Test',
    description: '# Test',
    tags: ['test'],
  }),
}))
```

### Mock Firebase (helpers/mock-firebase.ts)
```typescript
export const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ exists: true, data: () => ({ id: 'test' }) }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
    })),
    where: vi.fn(() => ({ get: vi.fn().mockResolvedValue({ docs: [] }) })),
  })),
}

export const resetMocks = () => vi.clearAllMocks()
```

### Mock Next.js Request
```typescript
const createMockRequest = (options: { method?: string, body?: object, headers?: Record<string, string> }) => {
  return new NextRequest('http://localhost:3000/api/test', {
    method: options.method || 'GET',
    headers: new Headers(options.headers),
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
}
```

## API Route Testing

```typescript
import { GET, POST } from '@/app/api/projects/route'
import { mockFirebaseAdmin, resetMocks } from '../helpers/mock-firebase'

describe('GET /api/projects', () => {
  beforeEach(() => {
    resetMocks()
    mockFirebaseAdmin()
  })

  it('should return projects list', async () => {
    const request = createMockRequest({ method: 'GET' })
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(Array.isArray(data.data)).toBe(true)
  })
})

describe('POST /api/projects', () => {
  it('should create project with valid data', async () => {
    vi.mock('@/lib/auth-utils', () => ({
      verifyAuth: vi.fn().mockResolvedValue({ uid: 'test-user' }),
    }))

    const request = createMockRequest({
      method: 'POST',
      body: { title: 'Test', description: 'Desc' },
      headers: { 'Authorization': 'Bearer token' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('should reject without auth', async () => {
    vi.mock('@/lib/auth-utils', () => ({
      verifyAuth: vi.fn().mockResolvedValue(null),
    }))

    const response = await POST(createMockRequest({ method: 'POST' }))
    expect(response.status).toBe(401)
  })
})
```

## Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import Button from '@/components/Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)
    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
```

## Assertions Reference

```typescript
// Basic
expect(value).toBe(expected)
expect(value).toEqual({ key: 'value' })
expect(value).toBeTruthy()
expect(value).toBeNull()

// Numbers
expect(value).toBeGreaterThan(3)
expect(value).toBeCloseTo(0.3, 5)

// Strings
expect(value).toMatch(/pattern/)
expect(value).toContain('substring')

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Objects
expect(obj).toHaveProperty('key', 'value')
expect(obj).toMatchObject({ key: 'value' })

// Errors
expect(() => fn()).toThrow('message')
expect(async () => await fn()).rejects.toThrow()
```

## Coverage Targets
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%
