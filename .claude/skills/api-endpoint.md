---
name: creating-api-endpoints
description: Creates Next.js API routes with Firebase. Use when adding GET/POST/PATCH/DELETE endpoints, implementing pagination, adding auth checks, or handling file uploads. Includes route templates and error handling.
---

# API Endpoint Skill

## When to Use
- Creating new API routes in `src/app/api/`
- Adding CRUD operations for resources
- Implementing pagination and filtering
- Adding authentication/authorization checks
- Creating file upload endpoints

## File Structure

### Route Location
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
│   ├── route.ts                    # POST (create/update)
│   └── [id]/
│       ├── route.ts                # GET, PATCH
│       ├── likes/route.ts          # GET
│       └── withdraw/route.ts       # POST
├── comments/
│   └── [id]/route.ts               # DELETE
├── whispers/
│   ├── route.ts                    # GET, POST
│   └── [id]/route.ts               # PATCH
├── ai/
│   └── generate/route.ts           # GET, POST
├── upload/route.ts                 # POST
└── stats/route.ts                  # GET
```

## Basic Route Template

### Public GET Endpoint
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()

    // Get query params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    // Fetch data
    const snapshot = await db
      .collection(COLLECTIONS.PROJECTS)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get()

    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    }))

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

### Protected POST Endpoint
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth } from '@/lib/auth-utils'
import { validateString, CONTENT_LIMITS } from '@/lib/security-utils'
import {
  checkRateLimit,
  getClientIdentifier,
  RATE_LIMIT_CONFIGS,
} from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const clientIp = getClientIdentifier(request)
    const { allowed } = checkRateLimit(clientIp, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)
    if (!allowed) {
      return NextResponse.json(
        { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // 2. Authentication
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 3. Parse request body
    const body = await request.json()

    // 4. Validate input
    const titleResult = validateString(body.title, '제목', {
      required: true,
      maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
    })
    if (!titleResult.valid) {
      return NextResponse.json({ error: titleResult.error }, { status: 400 })
    }

    // 5. Create document
    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc()
    const now = Timestamp.now()

    const data = {
      id: docRef.id,
      title: titleResult.value,
      authorId: authUser.uid,
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(data)

    // 6. Return response
    return NextResponse.json(
      {
        ...data,
        createdAt: now.toDate().toISOString(),
        updatedAt: now.toDate().toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

## Dynamic Route Template

### Route with ID Parameter (`[id]/route.ts`)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth } from '@/lib/auth-utils'
import { isValidDocumentId } from '@/lib/security-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET single item
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Validate ID
    if (!isValidDocumentId(id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID입니다.' },
        { status: 400 }
      )
    }

    const db = getAdminDb()
    const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const data = doc.data()
    return NextResponse.json({
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate().toISOString(),
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '데이터를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// UPDATE item (owner only)
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // Auth check
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Owner check
    if (doc.data()?.authorId !== authUser.uid) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    // Update
    const body = await request.json()
    // ... validate and update

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE item (owner only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    if (doc.data()?.authorId !== authUser.uid) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      )
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: '삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
```

## Pagination

### Cursor-based Pagination
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')

  const db = getAdminDb()
  let query = db
    .collection(COLLECTIONS.PROJECTS)
    .orderBy('createdAt', 'desc')
    .limit(limit + 1) // Fetch one extra to check hasMore

  // Apply cursor
  if (cursor) {
    const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snapshot = await query.get()
  const docs = snapshot.docs
  const hasMore = docs.length > limit
  const data = docs.slice(0, limit).map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  return NextResponse.json({
    data,
    nextCursor: hasMore ? docs[limit - 1].id : null,
    hasMore,
  })
}
```

## Search & Filtering

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search')?.toLowerCase()
  const platform = searchParams.get('platform')

  const db = getAdminDb()
  let query: FirebaseFirestore.Query = db
    .collection(COLLECTIONS.PROJECTS)
    .orderBy('createdAt', 'desc')

  // Filter by platform
  if (platform && platform !== 'ALL') {
    query = query.where('platform', '==', platform)
  }

  const snapshot = await query.get()

  // Client-side search (Firestore doesn't support full-text search)
  let data = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))

  if (search) {
    data = data.filter(
      (item) =>
        item.title?.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.tags?.some((tag: string) => tag.toLowerCase().includes(search))
    )
  }

  return NextResponse.json({ data })
}
```

## Response Helpers

```typescript
// Success responses
return NextResponse.json(data)                           // 200 OK
return NextResponse.json(data, { status: 201 })          // 201 Created
return new NextResponse(null, { status: 204 })           // 204 No Content

// Error responses
return NextResponse.json({ error: '메시지' }, { status: 400 })  // Bad Request
return NextResponse.json({ error: '메시지' }, { status: 401 })  // Unauthorized
return NextResponse.json({ error: '메시지' }, { status: 403 })  // Forbidden
return NextResponse.json({ error: '메시지' }, { status: 404 })  // Not Found
return NextResponse.json({ error: '메시지' }, { status: 429 })  // Too Many Requests
return NextResponse.json({ error: '메시지' }, { status: 500 })  // Internal Error
```

## Common Patterns

### Toggle Endpoint (Like/Unlike)
```typescript
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  const db = getAdminDb()
  const likeRef = db.collection('likes').doc(`${authUser.uid}_${id}`)
  const likeDoc = await likeRef.get()

  if (likeDoc.exists) {
    // Unlike
    await likeRef.delete()
    await db.collection('projects').doc(id).update({
      likes: FieldValue.increment(-1),
    })
    return NextResponse.json({ liked: false })
  } else {
    // Like
    await likeRef.set({ userId: authUser.uid, projectId: id })
    await db.collection('projects').doc(id).update({
      likes: FieldValue.increment(1),
    })
    return NextResponse.json({ liked: true })
  }
}
```

### File Upload Endpoint
```typescript
export async function POST(request: NextRequest) {
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  const formData = await request.formData()
  const file = formData.get('file') as File

  // Validate
  if (!file) {
    return badRequestResponse('파일이 필요합니다.')
  }

  if (file.size > 5 * 1024 * 1024) {
    return badRequestResponse('파일 크기는 5MB 이하여야 합니다.')
  }

  // Upload to Vercel Blob
  const blob = await put(file.name, file, {
    access: 'public',
  })

  return NextResponse.json({ url: blob.url })
}
```

## Error Messages (Korean)

```typescript
// Common error messages
'인증이 필요합니다.'           // 401 - Unauthorized
'권한이 없습니다.'             // 403 - Forbidden
'찾을 수 없습니다.'            // 404 - Not Found
'요청이 너무 많습니다.'        // 429 - Rate limit
'서버 오류가 발생했습니다.'    // 500 - Internal error

// Validation errors
'필수 항목입니다.'
'유효한 URL을 입력해주세요.'
'최대 {n}자까지 입력 가능합니다.'
'유효하지 않은 값입니다.'
```

## API Client Integration

After creating an endpoint, add to `src/lib/api-client.ts`:

```typescript
// Add function to api-client.ts
export const newEndpoint = async (data: InputType): Promise<ResponseType> => {
  const response = await fetchWithAuth('/api/new-endpoint', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return response.json()
}
```

## Testing New Endpoints

See `testing.md` for API route testing patterns.
