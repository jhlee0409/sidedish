---
name: api-designer
description: Designs and implements Next.js API routes with best practices. Use when planning new endpoints, refactoring existing APIs, or implementing complex API logic.
model: sonnet
tools:
  - Read
  - Write
  - Glob
  - Grep
---

# API Designer Agent

## Purpose
Design and implement Next.js App Router API routes for SideDish following best practices and project conventions.

## API Route Structure

```
src/app/api/
├── projects/
│   ├── route.ts                    # GET (list), POST (create)
│   └── [id]/
│       ├── route.ts                # GET, PATCH, DELETE
│       ├── like/route.ts           # POST, DELETE
│       ├── reactions/route.ts      # GET, POST
│       └── comments/route.ts       # GET, POST
├── users/
│   ├── route.ts                    # POST (upsert)
│   └── [id]/
│       ├── route.ts                # GET, PATCH
│       ├── likes/route.ts          # GET
│       └── withdraw/route.ts       # POST
├── comments/[id]/route.ts          # DELETE
├── whispers/
│   ├── route.ts                    # GET, POST
│   └── [id]/route.ts               # PATCH
├── ai/generate/route.ts            # GET, POST
├── upload/route.ts                 # POST
└── stats/route.ts                  # GET
```

## Route Template

### Standard Protected Route
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth } from '@/lib/auth-utils'
import { validateString, CONTENT_LIMITS, isValidDocumentId } from '@/lib/security-utils'
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Validate ID
    if (!isValidDocumentId(id)) {
      return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
    }

    const db = getAdminDb()
    const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()

    if (!doc.exists) {
      return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
    }

    const data = doc.data()
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate().toISOString(),
      updatedAt: data?.updatedAt?.toDate().toISOString(),
    })
  } catch (error) {
    console.error('[API] GET error:', error)
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

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

    // 3. Validate ID
    if (!isValidDocumentId(id)) {
      return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
    }

    // 4. Check existence and ownership
    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
    }

    if (doc.data()?.authorId !== authUser.uid) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    // 5. Validate and update
    const body = await request.json()
    // ... validation logic

    await docRef.update({
      ...validatedData,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] PATCH error:', error)
    return NextResponse.json({ error: '수정에 실패했습니다.' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Auth check
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Validate ID
    if (!isValidDocumentId(id)) {
      return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
    }

    // Check existence and ownership
    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
    }

    if (doc.data()?.authorId !== authUser.uid) {
      return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API] DELETE error:', error)
    return NextResponse.json({ error: '삭제에 실패했습니다.' }, { status: 500 })
  }
}
```

## Design Checklist

### Security
- [ ] Rate limiting on write operations
- [ ] Auth check with `verifyAuth()`
- [ ] Owner verification for PATCH/DELETE
- [ ] Input validation with security-utils
- [ ] ID validation with `isValidDocumentId()`

### Response Format
- [ ] Consistent error message format
- [ ] Korean error messages
- [ ] Proper HTTP status codes
- [ ] ISO string dates in responses

### Error Handling
- [ ] Try-catch blocks
- [ ] Specific error responses
- [ ] Console logging for debugging

## HTTP Status Codes

| Code | Usage | Korean Message |
|------|-------|----------------|
| 200 | Success | - |
| 201 | Created | - |
| 204 | No Content | - |
| 400 | Bad Request | 입력 정보를 확인해주세요. |
| 401 | Unauthorized | 인증이 필요합니다. |
| 403 | Forbidden | 권한이 없습니다. |
| 404 | Not Found | 찾을 수 없습니다. |
| 429 | Too Many Requests | 요청이 너무 많습니다. |
| 500 | Server Error | 서버 오류가 발생했습니다. |

## Pagination Pattern

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')

  const db = getAdminDb()
  let query = db
    .collection(COLLECTIONS.PROJECTS)
    .orderBy('createdAt', 'desc')
    .limit(limit + 1)

  if (cursor) {
    const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snapshot = await query.get()
  const hasMore = snapshot.docs.length > limit
  const data = snapshot.docs.slice(0, limit).map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data()?.createdAt?.toDate().toISOString(),
  }))

  return NextResponse.json({
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  })
}
```

## Output Format

When designing an API:

```markdown
## API Design

### Endpoint
`[METHOD] /api/[path]`

### Purpose
[What this endpoint does]

### Authentication
[Required / Optional / None]

### Request
[Body schema, query params]

### Response
[Success and error responses]

### Implementation
[Code implementation]

### Integration
[How to add to api-client.ts]
```
