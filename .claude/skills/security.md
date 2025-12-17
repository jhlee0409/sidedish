---
name: implementing-security
description: Implements security features following OWASP guidelines. Use when validating input, preventing XSS, adding rate limiting, verifying auth, or handling file uploads. Includes security-utils, sanitize-utils, and rate-limiter patterns.
---

# Security Skill

## When to Use
- Validating user input (strings, URLs, tags)
- Preventing XSS with DOMPurify/SafeMarkdown
- Adding rate limiting to API endpoints
- Verifying authentication and authorization
- Validating file uploads (magic numbers)

## Input Validation (`src/lib/security-utils.ts`)

### Content Limits
```typescript
import { CONTENT_LIMITS } from '@/lib/security-utils'

CONTENT_LIMITS.USER_NAME_MAX       // 20
CONTENT_LIMITS.PROJECT_TITLE_MAX   // 100
CONTENT_LIMITS.SHORT_DESC_MAX      // 80
CONTENT_LIMITS.PROJECT_DESC_MAX    // 10000
CONTENT_LIMITS.COMMENT_MAX         // 1000
CONTENT_LIMITS.WHISPER_MAX         // 2000
CONTENT_LIMITS.TAG_MAX_LENGTH      // 30
CONTENT_LIMITS.TAGS_MAX_COUNT      // 10
CONTENT_LIMITS.SEARCH_QUERY_MAX    // 100
```

### String Validation
```typescript
import { validateString } from '@/lib/security-utils'

const result = validateString(input, 'fieldName', {
  required: true,
  minLength: 2,
  maxLength: 100,
})

if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: 400 })
}

// Use sanitized value
const safeValue = result.value
```

### URL Validation
```typescript
import { validateUrl } from '@/lib/security-utils'

const result = validateUrl(url, 'link', { required: true })

if (!result.valid) {
  return badRequestResponse(result.error)
}
```

### Tags Validation
```typescript
import { validateTags } from '@/lib/security-utils'

const result = validateTags(tags)

if (!result.valid) {
  return badRequestResponse(result.error)
}

// Returns sanitized tags array
const safeTags = result.value
```

### Type Guards
```typescript
import {
  isValidReactionKey,
  isValidPlatform,
  isValidDocumentId,
} from '@/lib/security-utils'

if (!isValidReactionKey(reactionKey)) {
  return badRequestResponse('유효하지 않은 리액션입니다.')
}

if (!isValidPlatform(platform)) {
  return badRequestResponse('유효하지 않은 플랫폼입니다.')
}

if (!isValidDocumentId(projectId)) {
  return badRequestResponse('유효하지 않은 ID입니다.')
}
```

## XSS Prevention (`src/lib/sanitize-utils.ts`)

### HTML Sanitization
```typescript
import { sanitizeHtml, sanitizePlainText, containsDangerousPatterns } from '@/lib/sanitize-utils'

// For markdown content (preserves safe HTML)
const safeHtml = sanitizeHtml(userMarkdown)

// For plain text (strips all HTML)
const safeText = sanitizePlainText(userComment)

// Check for suspicious patterns
if (containsDangerousPatterns(content)) {
  console.warn('Suspicious content detected')
  // Log or reject
}
```

### Safe Markdown Component
```tsx
import SafeMarkdown from '@/components/SafeMarkdown'

// Always use for user-generated markdown
<SafeMarkdown className="prose prose-slate">
  {project.description}
</SafeMarkdown>
```

## Rate Limiting (`src/lib/rate-limiter.ts`)

### Configurations
```typescript
import { RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

// Available presets:
RATE_LIMIT_CONFIGS.PUBLIC_READ        // 60 req/min
RATE_LIMIT_CONFIGS.AUTHENTICATED_READ // 120 req/min
RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE // 30 req/min
RATE_LIMIT_CONFIGS.SENSITIVE          // 5 req/hour
RATE_LIMIT_CONFIGS.UPLOAD             // 10 req/min
RATE_LIMIT_CONFIGS.AI_GENERATE        // 5 req/min
```

### Implementation in API Route
```typescript
import {
  checkRateLimit,
  getClientIdentifier,
  createRateLimitKey,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  // Get client identifier (IP or user ID)
  const clientIp = getClientIdentifier(request)

  // For authenticated requests, combine with user ID
  const authUser = await verifyAuth(request)
  const rateLimitKey = authUser
    ? createRateLimitKey(authUser.uid, clientIp)
    : clientIp

  // Check rate limit
  const { allowed, remaining, resetMs } = checkRateLimit(
    rateLimitKey,
    RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE
  )

  if (!allowed) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': resetMs.toString(),
        },
      }
    )
  }

  // Process request...
}
```

## File Validation (`src/lib/file-validation.ts`)

### Magic Number Validation
```typescript
import { validateMagicNumber, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File

  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return badRequestResponse('허용되지 않는 파일 형식입니다.')
  }

  // Check file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return badRequestResponse('파일 크기는 5MB 이하여야 합니다.')
  }

  // Validate magic numbers to prevent disguised files
  const buffer = Buffer.from(await file.arrayBuffer())
  if (!validateMagicNumber(buffer, file.type)) {
    return badRequestResponse('파일이 손상되었거나 위장된 파일입니다.')
  }

  // Process file...
}
```

## Authentication (`src/lib/auth-utils.ts`)

### Token Verification
```typescript
import { verifyAuth } from '@/lib/auth-utils'

export async function POST(request: NextRequest) {
  const authUser = await verifyAuth(request)

  if (!authUser) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    )
  }

  // User is authenticated
  const userId = authUser.uid
}
```

### Owner Check
```typescript
// Check if user owns the resource
if (project.authorId !== authUser.uid) {
  return NextResponse.json(
    { error: '권한이 없습니다.' },
    { status: 403 }
  )
}
```

## Common Security Patterns

### API Route Template with Full Security
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth-utils'
import { validateString, CONTENT_LIMITS } from '@/lib/security-utils'
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const clientIp = getClientIdentifier(request)
  const { allowed } = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)
  if (!allowed) {
    return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })
  }

  // 2. Authentication
  const authUser = await verifyAuth(request)
  if (!authUser) {
    return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
  }

  // 3. Input validation
  const body = await request.json()
  const titleResult = validateString(body.title, 'title', {
    required: true,
    maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
  })
  if (!titleResult.valid) {
    return NextResponse.json({ error: titleResult.error }, { status: 400 })
  }

  // 4. Process with sanitized data
  const safeTitle = titleResult.value

  // 5. Database operation...
}
```

### Client-Side Security
```typescript
'use client'

import { sanitizePlainText } from '@/lib/sanitize-utils'

// Sanitize before displaying user input
const displayComment = sanitizePlainText(comment.content)

// Use SafeMarkdown for markdown content
<SafeMarkdown>{project.description}</SafeMarkdown>

// Never use dangerouslySetInnerHTML with user content
// BAD: <div dangerouslySetInnerHTML={{ __html: userContent }} />
// GOOD: <SafeMarkdown>{userContent}</SafeMarkdown>
```

## Security Checklist for New Features

- [ ] Input validation with `validateString`, `validateUrl`, etc.
- [ ] XSS prevention with `SafeMarkdown` or `sanitizePlainText`
- [ ] Authentication check with `verifyAuth`
- [ ] Authorization check (owner verification)
- [ ] Rate limiting with `checkRateLimit`
- [ ] File validation with `validateMagicNumber`
- [ ] SQL injection prevention (Firestore handles this)
- [ ] CSRF protection (Next.js handles this for API routes)

## OWASP Top 10 Coverage

| Vulnerability | Protection |
|--------------|------------|
| Injection | Firestore escapes queries, input validation |
| Broken Auth | Firebase Auth, token verification |
| Sensitive Data | Environment variables, HTTPS |
| XXE | Not applicable (no XML) |
| Broken Access Control | Owner checks, auth verification |
| Security Misconfiguration | Strict TypeScript, ESLint |
| XSS | DOMPurify, SafeMarkdown |
| Insecure Deserialization | JSON schema validation |
| Known Vulnerabilities | Regular `pnpm audit` |
| Insufficient Logging | Console logging, error tracking |
