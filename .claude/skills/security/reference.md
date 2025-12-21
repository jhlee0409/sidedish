# Security Reference

## Input Validation (`src/lib/security-utils.ts`)

### Content Limits
```typescript
CONTENT_LIMITS.USER_NAME_MAX       // 20
CONTENT_LIMITS.PROJECT_TITLE_MAX   // 100
CONTENT_LIMITS.SHORT_DESC_MAX      // 80
CONTENT_LIMITS.PROJECT_DESC_MAX    // 10000
CONTENT_LIMITS.COMMENT_MAX         // 1000
CONTENT_LIMITS.WHISPER_MAX         // 2000
CONTENT_LIMITS.TAG_MAX_LENGTH      // 30
CONTENT_LIMITS.TAGS_MAX_COUNT      // 10
```

### String Validation
```typescript
const result = validateString(input, 'fieldName', {
  required: true,
  minLength: 2,
  maxLength: 100,
})

if (!result.valid) {
  return NextResponse.json({ error: result.error }, { status: 400 })
}
const safeValue = result.value  // Sanitized
```

### URL Validation
```typescript
const result = validateUrl(url, 'link', { required: true })
```

### Tags Validation
```typescript
const result = validateTags(tags)
const safeTags = result.value  // Sanitized array
```

### Type Guards
```typescript
isValidReactionKey(key)     // 'fire' | 'clap' | 'party' | 'idea' | 'love'
isValidPlatform(platform)   // 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'
isValidDocumentId(id)       // Valid Firestore ID
```

## XSS Prevention (`src/lib/sanitize-utils.ts`)

```typescript
// For markdown content (preserves safe HTML)
const safeHtml = sanitizeHtml(userMarkdown)

// For plain text (strips all HTML)
const safeText = sanitizePlainText(userComment)

// Check for suspicious patterns
if (containsDangerousPatterns(content)) {
  console.warn('Suspicious content detected')
}
```

### SafeMarkdown Component
```tsx
import SafeMarkdown from '@/components/SafeMarkdown'

<SafeMarkdown className="prose prose-slate">
  {project.description}
</SafeMarkdown>
```

## Rate Limiting (`src/lib/rate-limiter.ts`)

### Presets
```typescript
RATE_LIMIT_CONFIGS.PUBLIC_READ        // 60 req/min
RATE_LIMIT_CONFIGS.AUTHENTICATED_READ // 120 req/min
RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE // 30 req/min
RATE_LIMIT_CONFIGS.SENSITIVE          // 5 req/hour
RATE_LIMIT_CONFIGS.UPLOAD             // 10 req/min
RATE_LIMIT_CONFIGS.AI_GENERATE        // 5 req/min
```

### Implementation
```typescript
const clientIp = getClientIdentifier(request)
const authUser = await verifyAuth(request)
const rateLimitKey = authUser ? createRateLimitKey(authUser.uid, clientIp) : clientIp

const { allowed, remaining, resetMs } = checkRateLimit(
  rateLimitKey,
  RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE
)

if (!allowed) {
  return NextResponse.json(
    { error: '요청이 너무 많습니다.' },
    { status: 429, headers: { 'X-RateLimit-Reset': resetMs.toString() } }
  )
}
```

## File Validation (`src/lib/file-validation.ts`)

```typescript
import { validateMagicNumber, ALLOWED_IMAGE_TYPES } from '@/lib/file-validation'

// Check file type
if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
  return badRequestResponse('허용되지 않는 파일 형식입니다.')
}

// Check file size (5MB)
if (file.size > 5 * 1024 * 1024) {
  return badRequestResponse('파일 크기는 5MB 이하여야 합니다.')
}

// Validate magic numbers
const buffer = Buffer.from(await file.arrayBuffer())
if (!validateMagicNumber(buffer, file.type)) {
  return badRequestResponse('파일이 손상되었거나 위장된 파일입니다.')
}
```

## Authentication (`src/lib/auth-utils.ts`)

```typescript
const authUser = await verifyAuth(request)

if (!authUser) {
  return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
}

// Owner check
if (project.authorId !== authUser.uid) {
  return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
}
```

## Full Security Template

```typescript
export async function POST(request: NextRequest) {
  // 1. Rate limiting
  const clientIp = getClientIdentifier(request)
  const { allowed } = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)
  if (!allowed) return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 })

  // 2. Authentication
  const authUser = await verifyAuth(request)
  if (!authUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 3. Input validation
  const body = await request.json()
  const titleResult = validateString(body.title, 'title', { required: true, maxLength: 100 })
  if (!titleResult.valid) return NextResponse.json({ error: titleResult.error }, { status: 400 })

  // 4. Process with sanitized data
  const safeTitle = titleResult.value
}
```

## OWASP Top 10 Coverage

| Vulnerability | Protection |
|--------------|------------|
| Injection | Firestore escapes, input validation |
| Broken Auth | Firebase Auth, token verification |
| XSS | DOMPurify, SafeMarkdown |
| Broken Access Control | Owner checks, auth verification |
| Security Misconfiguration | Strict TypeScript, ESLint |
