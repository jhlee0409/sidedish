---
name: testing
description: Writes tests using Vitest and Testing Library. Use when creating unit tests, API tests, component tests, or mocking Firebase/external services. Includes test patterns, assertions, and coverage targets.
---

# Testing Skill

## Instructions

1. Place tests in `src/__tests__/`
2. Use `describe/it/expect` pattern
3. Mock Firebase with helpers in `helpers/mock-firebase.ts`
4. Run: `pnpm test` (watch) or `pnpm test:run` (once)

## Test Template

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('functionName', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should do something when condition', () => {
    const result = functionName(input)
    expect(result).toBe('expected')
  })

  it('should throw error for invalid input', () => {
    expect(() => functionName(null)).toThrow('Error')
  })
})
```

## Common Assertions

```typescript
expect(value).toBe(expected)
expect(value).toEqual({ key: 'value' })
expect(array).toContain(item)
expect(fn).toHaveBeenCalledWith(arg)
expect(async () => await fn()).rejects.toThrow()
```

## Coverage Targets
- Statements: 80%
- Branches: 70%
- Functions: 80%

For mocking patterns, API testing, and component testing, see [reference.md](reference.md).
