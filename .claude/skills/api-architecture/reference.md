# API Architecture Reference

## Architecture Layers

```
┌─────────────────────────────────────────┐
│           Client Layer                   │
│        (React Components)                │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│         API Client Layer                 │
│     (src/lib/api-client.ts)             │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          API Route Layer                 │
│    (src/app/api/**/route.ts)            │
│ • Rate Limiting • Auth • Validation     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│          Service Layer                   │
│    (Business Logic - geminiService)     │
└─────────────────────────────────────────┘
                    │
┌─────────────────────────────────────────┐
│           Data Layer                     │
│    (Firebase Admin SDK)                  │
└─────────────────────────────────────────┘
```

## RESTful Design

### Resource Naming
```
GET    /api/projects          → List
POST   /api/projects          → Create
GET    /api/projects/[id]     → Read
PATCH  /api/projects/[id]     → Update
DELETE /api/projects/[id]     → Delete

# Nested resources
GET    /api/projects/[id]/comments

# Actions
POST   /api/projects/[id]/like
POST   /api/users/[id]/withdraw
```

### HTTP Methods
| Method | Idempotent | Body | Use Case |
|--------|------------|------|----------|
| GET | ✅ | ❌ | Read |
| POST | ❌ | ✅ | Create/Action |
| PATCH | ✅ | ✅ | Update |
| DELETE | ✅ | ❌ | Delete |

## Response Structure

### Success
```typescript
// Single item
{ "id": "abc", "title": "..." }

// List with pagination
{ "data": [...], "nextCursor": "id", "hasMore": true }

// Created (201)
{ "id": "new", ...createdData }

// Update/Delete
{ "success": true }
```

### Error
```typescript
{ "error": "한국어 메시지", "code": "ERROR_CODE", "details": { "field": "에러" } }
```

## Request Pipeline

```typescript
export async function POST(request: NextRequest) {
  // 1️⃣ Rate Limiting
  const { allowed } = checkRateLimit(clientId, config)
  if (!allowed) return rateLimitResponse()

  // 2️⃣ Authentication
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  // 3️⃣ Parse Body
  const body = await request.json()

  // 4️⃣ Validation
  const validation = validateInput(body)
  if (!validation.valid) return badRequestResponse(validation.error)

  // 5️⃣ Authorization
  if (!hasPermission(authUser.uid)) return forbiddenResponse()

  // 6️⃣ Execute
  const result = await process(validation.data)

  // 7️⃣ Response
  return NextResponse.json(result, { status: 201 })
}
```

## Pagination (Cursor-based)

```typescript
const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
const cursor = searchParams.get('cursor')

let query = db.collection('projects').orderBy('createdAt', 'desc').limit(limit + 1)

if (cursor) {
  const cursorDoc = await db.collection('projects').doc(cursor).get()
  if (cursorDoc.exists) query = query.startAfter(cursorDoc)
}

const snapshot = await query.get()
const hasMore = snapshot.docs.length > limit
const data = snapshot.docs.slice(0, limit).map(formatDoc)

return { data, nextCursor: hasMore ? data[data.length - 1].id : null, hasMore }
```

## Caching Strategy

### Client-Side (api-client.ts)
```typescript
const CACHE_TTL = {
  DEFAULT: 30 * 1000,
  USER_PROFILE: 5 * 60 * 1000,
  STATIC: 60 * 60 * 1000,
}

// Invalidation
invalidateCache('projects')  // Pattern-based
```

### Server-Side Headers
```typescript
return NextResponse.json(data, {
  headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
})
```

## Anti-Patterns

### ❌ Don't
```typescript
POST /api/action?type=createProject  // Multiple resources
GET /api/projects (body: {...})      // Body in GET
POST /api/createProject              // Verb URL
```

### ✅ Do
```typescript
POST /api/projects                   // Resource URL
GET /api/projects?platform=WEB       // Query params
DELETE /api/projects/[id]            // Method semantics
```

## File Organization

```
src/
├── app/api/
│   ├── projects/
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/route.ts      # GET, PATCH, DELETE
│   └── ...
├── lib/
│   ├── api-client.ts          # Client wrapper
│   ├── auth-utils.ts          # Auth helpers
│   ├── security-utils.ts      # Validation
│   └── rate-limiter.ts        # Rate limiting
└── services/
    └── geminiService.ts       # Business logic
```
