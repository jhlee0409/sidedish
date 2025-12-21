# API Endpoint Reference

## File Structure

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
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

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
    return NextResponse.json({ error: '데이터를 불러오는데 실패했습니다.' }, { status: 500 })
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
import { checkRateLimit, getClientIdentifier, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

export async function POST(request: NextRequest) {
  try {
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

    // 3. Parse & validate
    const body = await request.json()
    const titleResult = validateString(body.title, '제목', {
      required: true,
      maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
    })
    if (!titleResult.valid) {
      return NextResponse.json({ error: titleResult.error }, { status: 400 })
    }

    // 4. Create document
    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.PROJECTS).doc()
    const now = Timestamp.now()

    await docRef.set({
      id: docRef.id,
      title: titleResult.value,
      authorId: authUser.uid,
      createdAt: now,
      updatedAt: now,
    })

    return NextResponse.json({ id: docRef.id }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: '생성에 실패했습니다.' }, { status: 500 })
  }
}
```

## Dynamic Route Template

### Route with ID Parameter (`[id]/route.ts`)
```typescript
interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  if (!isValidDocumentId(id)) {
    return NextResponse.json({ error: '유효하지 않은 ID입니다.' }, { status: 400 })
  }

  const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
  if (!doc.exists) {
    return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
  }

  return NextResponse.json({ id: doc.id, ...doc.data() })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const authUser = await verifyAuth(request)
  if (!authUser) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
  if (!doc.exists) return NextResponse.json({ error: '찾을 수 없습니다.' }, { status: 404 })
  if (doc.data()?.authorId !== authUser.uid) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  // Update logic...
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  // Similar pattern with auth + owner check
}
```

## Pagination (Cursor-based)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')

  let query = db.collection(COLLECTIONS.PROJECTS)
    .orderBy('createdAt', 'desc')
    .limit(limit + 1)

  if (cursor) {
    const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
    if (cursorDoc.exists) query = query.startAfter(cursorDoc)
  }

  const snapshot = await query.get()
  const hasMore = snapshot.docs.length > limit
  const data = snapshot.docs.slice(0, limit).map(doc => ({ id: doc.id, ...doc.data() }))

  return NextResponse.json({
    data,
    nextCursor: hasMore ? docs[limit - 1].id : null,
    hasMore,
  })
}
```

## Toggle Endpoint (Like/Unlike)

```typescript
export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  const likeRef = db.collection('likes').doc(`${authUser.uid}_${id}`)
  const likeDoc = await likeRef.get()

  if (likeDoc.exists) {
    await likeRef.delete()
    await db.collection('projects').doc(id).update({ likes: FieldValue.increment(-1) })
    return NextResponse.json({ liked: false })
  } else {
    await likeRef.set({ userId: authUser.uid, projectId: id })
    await db.collection('projects').doc(id).update({ likes: FieldValue.increment(1) })
    return NextResponse.json({ liked: true })
  }
}
```

## File Upload Endpoint

```typescript
export async function POST(request: NextRequest) {
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  const formData = await request.formData()
  const file = formData.get('file') as File

  if (!file) return badRequestResponse('파일이 필요합니다.')
  if (file.size > 5 * 1024 * 1024) return badRequestResponse('파일 크기는 5MB 이하여야 합니다.')

  const blob = await put(file.name, file, { access: 'public' })
  return NextResponse.json({ url: blob.url })
}
```

## Error Messages (Korean)

```typescript
'인증이 필요합니다.'           // 401
'권한이 없습니다.'             // 403
'찾을 수 없습니다.'            // 404
'요청이 너무 많습니다.'        // 429
'서버 오류가 발생했습니다.'    // 500
'필수 항목입니다.'
'유효한 URL을 입력해주세요.'
'최대 {n}자까지 입력 가능합니다.'
```
