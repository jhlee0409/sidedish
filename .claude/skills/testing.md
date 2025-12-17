---
name: writing-tests-vitest
description: Writes tests using Vitest and Testing Library. Use when creating unit tests, API tests, component tests, or mocking Firebase/external services. Includes test patterns, assertions, and coverage targets.
---

# Testing Skill

## When to Use
- Writing unit tests for utilities
- Testing API routes
- Testing React components
- Mocking Firebase and external services
- Running coverage reports

## Test Setup

### Configuration
Tests are configured in `vitest.config.ts`:
- Test environment: `jsdom`
- Setup file: `src/__tests__/setup.ts`

### Running Tests
```bash
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage report
pnpm test security  # Run specific file
```

## Test File Location
Place tests in `src/__tests__/`:
```
src/__tests__/
├── setup.ts                   # Global test setup
├── helpers/
│   └── mock-firebase.ts       # Firebase mocking utilities
├── security-utils.test.ts     # Unit tests
├── sanitize-utils.test.ts
├── rate-limiter.test.ts
├── file-validation.test.ts
└── api/
    └── projects.test.ts       # API integration tests
```

## Basic Test Structure

### Unit Test Template
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('functionName', () => {
  beforeEach(() => {
    // Setup before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Cleanup after each test
  })

  it('should do something when condition', () => {
    // Arrange
    const input = 'test input'

    // Act
    const result = functionName(input)

    // Assert
    expect(result).toBe('expected output')
  })

  it('should handle edge case', () => {
    expect(functionName('')).toBeNull()
  })

  it('should throw error for invalid input', () => {
    expect(() => functionName(null)).toThrow('Error message')
  })
})
```

### Nested Describes
```typescript
describe('security-utils', () => {
  describe('validateString', () => {
    describe('with required option', () => {
      it('should reject empty string', () => {
        const result = validateString('', 'name', { required: true })
        expect(result.valid).toBe(false)
      })

      it('should accept non-empty string', () => {
        const result = validateString('valid', 'name', { required: true })
        expect(result.valid).toBe(true)
      })
    })

    describe('with maxLength option', () => {
      it('should reject string exceeding limit', () => {
        const result = validateString('a'.repeat(101), 'name', { maxLength: 100 })
        expect(result.valid).toBe(false)
      })
    })
  })
})
```

## Testing Validation Functions

```typescript
import { describe, it, expect } from 'vitest'
import { validateString, validateUrl, validateTags } from '@/lib/security-utils'

describe('validateString', () => {
  it('should validate required strings', () => {
    expect(validateString('', 'test', { required: true }).valid).toBe(false)
    expect(validateString('valid', 'test', { required: true }).valid).toBe(true)
  })

  it('should validate string length', () => {
    expect(validateString('ab', 'test', { minLength: 3 }).valid).toBe(false)
    expect(validateString('abc', 'test', { minLength: 3 }).valid).toBe(true)
    expect(validateString('a'.repeat(101), 'test', { maxLength: 100 }).valid).toBe(false)
  })

  it('should sanitize HTML', () => {
    const result = validateString('<script>alert("xss")</script>test', 'test')
    expect(result.valid).toBe(true)
    expect(result.value).not.toContain('<script>')
  })
})

describe('validateUrl', () => {
  it('should accept valid URLs', () => {
    expect(validateUrl('https://example.com', 'url').valid).toBe(true)
    expect(validateUrl('http://localhost:3000', 'url').valid).toBe(true)
  })

  it('should reject invalid URLs', () => {
    expect(validateUrl('not-a-url', 'url').valid).toBe(false)
    expect(validateUrl('javascript:alert(1)', 'url').valid).toBe(false)
  })
})

describe('validateTags', () => {
  it('should validate tags array', () => {
    expect(validateTags(['tag1', 'tag2']).valid).toBe(true)
    expect(validateTags([]).valid).toBe(true)
  })

  it('should reject too many tags', () => {
    const manyTags = Array(15).fill('tag')
    expect(validateTags(manyTags).valid).toBe(false)
  })
})
```

## Mocking

### Mock Functions
```typescript
import { vi } from 'vitest'

// Create mock function
const mockFn = vi.fn()
mockFn.mockReturnValue('value')
mockFn.mockResolvedValue('async value')
mockFn.mockRejectedValue(new Error('error'))

// Verify calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith('arg')
expect(mockFn).toHaveBeenCalledTimes(2)
```

### Mock Modules
```typescript
import { vi } from 'vitest'

// Mock entire module
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        get: vi.fn(),
        set: vi.fn(),
        update: vi.fn(),
      })),
    })),
  })),
}))

// Mock specific function
vi.mock('@/services/geminiService', () => ({
  generateProjectContent: vi.fn().mockResolvedValue({
    shortDescription: 'Test description',
    description: '# Test\n\nContent',
    tags: ['test'],
  }),
}))
```

### Mock Firebase (`src/__tests__/helpers/mock-firebase.ts`)
```typescript
import { vi } from 'vitest'

export const mockFirebaseAdmin = () => {
  vi.mock('@/lib/firebase-admin', () => ({
    getAdminDb: vi.fn(() => mockDb),
    COLLECTIONS: {
      PROJECTS: 'projects',
      USERS: 'users',
      COMMENTS: 'comments',
    },
  }))
}

export const mockDb = {
  collection: vi.fn(() => ({
    doc: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({
        exists: true,
        data: () => ({ id: 'test-id', title: 'Test' }),
      }),
      set: vi.fn().mockResolvedValue({}),
      update: vi.fn().mockResolvedValue({}),
      delete: vi.fn().mockResolvedValue({}),
    })),
    where: vi.fn(() => ({
      get: vi.fn().mockResolvedValue({ docs: [] }),
    })),
  })),
}

export const resetMocks = () => {
  vi.clearAllMocks()
}
```

### Mock Next.js Request/Response
```typescript
import { NextRequest } from 'next/server'

const createMockRequest = (options: {
  method?: string
  body?: object
  headers?: Record<string, string>
}) => {
  const { method = 'GET', body, headers = {} } = options

  return new NextRequest('http://localhost:3000/api/test', {
    method,
    headers: new Headers(headers),
    body: body ? JSON.stringify(body) : undefined,
  })
}

// Usage
const request = createMockRequest({
  method: 'POST',
  body: { title: 'Test' },
  headers: { 'Authorization': 'Bearer test-token' },
})
```

## Testing API Routes

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
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
    expect(data).toHaveProperty('data')
    expect(Array.isArray(data.data)).toBe(true)
  })
})

describe('POST /api/projects', () => {
  beforeEach(() => {
    resetMocks()
    mockFirebaseAdmin()
    // Mock auth
    vi.mock('@/lib/auth-utils', () => ({
      verifyAuth: vi.fn().mockResolvedValue({ uid: 'test-user' }),
    }))
  })

  it('should create project with valid data', async () => {
    const request = createMockRequest({
      method: 'POST',
      body: {
        title: 'Test Project',
        description: 'Description',
        shortDescription: 'Short',
        tags: ['test'],
        platform: 'WEB',
        link: 'https://example.com',
        imageUrl: 'https://example.com/image.jpg',
      },
      headers: { 'Authorization': 'Bearer valid-token' },
    })

    const response = await POST(request)
    expect(response.status).toBe(201)
  })

  it('should reject without auth', async () => {
    vi.mock('@/lib/auth-utils', () => ({
      verifyAuth: vi.fn().mockResolvedValue(null),
    }))

    const request = createMockRequest({
      method: 'POST',
      body: { title: 'Test' },
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
  })
})
```

## Testing React Components

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Button from '@/components/Button'

describe('Button', () => {
  it('should render with text', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>Click</Button>)

    fireEvent.click(screen.getByText('Click'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when loading', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('should show loading spinner', () => {
    render(<Button isLoading>Submit</Button>)
    expect(screen.getByText('처리 중...')).toBeInTheDocument()
  })
})
```

## Testing Async Code

```typescript
import { describe, it, expect, vi } from 'vitest'
import { waitFor } from '@testing-library/react'

describe('async function', () => {
  it('should resolve with data', async () => {
    const result = await fetchData()
    expect(result).toEqual({ data: 'test' })
  })

  it('should handle errors', async () => {
    await expect(fetchData('invalid')).rejects.toThrow('Error')
  })

  it('should wait for condition', async () => {
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument()
    })
  })
})
```

## Assertions Reference

```typescript
// Basic assertions
expect(value).toBe(expected)           // Strict equality
expect(value).toEqual(expected)        // Deep equality
expect(value).toBeTruthy()
expect(value).toBeFalsy()
expect(value).toBeNull()
expect(value).toBeUndefined()
expect(value).toBeDefined()

// Numbers
expect(value).toBeGreaterThan(3)
expect(value).toBeLessThanOrEqual(10)
expect(value).toBeCloseTo(0.3, 5)

// Strings
expect(value).toMatch(/pattern/)
expect(value).toContain('substring')

// Arrays
expect(array).toContain(item)
expect(array).toHaveLength(3)

// Objects
expect(object).toHaveProperty('key')
expect(object).toHaveProperty('key', 'value')
expect(object).toMatchObject({ key: 'value' })

// Errors
expect(() => fn()).toThrow()
expect(() => fn()).toThrow('message')
expect(async () => await fn()).rejects.toThrow()

// Mock calls
expect(mockFn).toHaveBeenCalled()
expect(mockFn).toHaveBeenCalledWith(arg)
expect(mockFn).toHaveBeenCalledTimes(2)
```

## Test Coverage

Run coverage report:
```bash
pnpm test:coverage
```

Coverage targets:
- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%
