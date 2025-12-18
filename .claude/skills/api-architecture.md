---
name: api-architecture-patterns
description: API 아키텍처 설계 원칙과 패턴을 적용합니다. RESTful API 설계, 버저닝, 응답 표준화, 미들웨어 패턴 구현 시 사용하세요. Next.js App Router 기반 서버리스 아키텍처에 최적화되어 있습니다.
allowed-tools: Read, Glob, Grep
---

# API Architecture Skill

## Overview

SideDish는 Next.js App Router를 사용한 서버리스 아키텍처입니다. 실제 백엔드 프레임워크 없이도 엔터프라이즈급 API 설계 원칙을 적용합니다.

## Architecture Principles

### 1. Layered Architecture (계층형 아키텍처)

```
┌─────────────────────────────────────────────────────┐
│                    Client Layer                      │
│              (React Components, Hooks)               │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  API Client Layer                    │
│          (src/lib/api-client.ts - Caching)          │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                 API Route Layer                      │
│        (src/app/api/**/route.ts - Handlers)         │
├─────────────────────────────────────────────────────┤
│ • Rate Limiting (rate-limiter.ts)                   │
│ • Authentication (auth-utils.ts)                    │
│ • Validation (security-utils.ts)                    │
│ • Authorization (owner checks)                      │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                  Service Layer                       │
│        (Business Logic - geminiService.ts)          │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────┐
│                   Data Layer                         │
│     (Firebase Admin SDK - firebase-admin.ts)        │
└─────────────────────────────────────────────────────┘
```

### 2. RESTful Design Principles

#### Resource Naming Convention

```
# 컬렉션 리소스 (복수형)
GET    /api/projects          → 목록 조회
POST   /api/projects          → 생성

# 개별 리소스 (ID)
GET    /api/projects/[id]     → 단건 조회
PATCH  /api/projects/[id]     → 수정
DELETE /api/projects/[id]     → 삭제

# 중첩 리소스 (관계)
GET    /api/projects/[id]/comments    → 프로젝트의 댓글
POST   /api/projects/[id]/comments    → 댓글 작성

# 액션 리소스 (동사 허용 케이스)
POST   /api/projects/[id]/like        → 좋아요 토글
POST   /api/users/[id]/withdraw       → 계정 탈퇴
POST   /api/ai/generate               → AI 생성
```

#### HTTP Method Semantics

| Method | Idempotent | Safe | Request Body | Use Case |
|--------|------------|------|--------------|----------|
| GET | ✅ | ✅ | ❌ | 리소스 조회 |
| POST | ❌ | ❌ | ✅ | 리소스 생성, 액션 실행 |
| PATCH | ✅ | ❌ | ✅ | 부분 수정 |
| DELETE | ✅ | ❌ | ❌ | 리소스 삭제 |

### 3. Response Structure Standards

#### Success Response

```typescript
// 단건 조회
{
  "id": "abc123",
  "title": "프로젝트 제목",
  "createdAt": "2025-01-15T09:00:00.000Z"
}

// 목록 조회 (페이지네이션)
{
  "data": [...],
  "nextCursor": "lastDocId" | null,
  "hasMore": true | false
}

// 생성 성공 (201 Created)
{
  "id": "newDocId",
  ...createdData,
  "createdAt": "2025-01-15T09:00:00.000Z"
}

// 수정/삭제 성공
{
  "success": true
}
```

#### Error Response

```typescript
// 표준 에러 형식
{
  "error": "사용자 친화적 한국어 메시지",
  "code": "ERROR_CODE",        // Optional: 프로그래밍용 코드
  "details": { ... }           // Optional: 추가 정보
}

// 검증 에러 (400)
{
  "error": "입력 정보를 확인해주세요.",
  "details": {
    "title": "제목은 필수입니다.",
    "link": "올바른 URL 형식이 아닙니다."
  }
}
```

## Request Processing Pipeline

### Standard Processing Order

```typescript
export async function POST(request: NextRequest) {
  // 1️⃣ Rate Limiting (가장 먼저 - 리소스 보호)
  const clientId = getClientIdentifier(request)
  const { allowed } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)
  if (!allowed) return rateLimitResponse()

  // 2️⃣ Authentication (인증)
  const authUser = await verifyAuth(request)
  if (!authUser) return unauthorizedResponse()

  // 3️⃣ Parse Request Body
  const body = await request.json()

  // 4️⃣ Input Validation (검증)
  const validation = validateInput(body)
  if (!validation.valid) return badRequestResponse(validation.error)

  // 5️⃣ Authorization (권한 - 필요시)
  const hasPermission = await checkPermission(authUser.uid, resourceId)
  if (!hasPermission) return forbiddenResponse()

  // 6️⃣ Business Logic (비즈니스 로직)
  const result = await processRequest(validation.data)

  // 7️⃣ Response (응답)
  return NextResponse.json(result, { status: 201 })
}
```

### Middleware Pattern (Helper Functions)

```typescript
// src/lib/api-helpers.ts
import { NextRequest, NextResponse } from 'next/server'

// Response helpers
export const jsonResponse = (data: unknown, status = 200) =>
  NextResponse.json(data, { status })

export const errorResponse = (message: string, status: number) =>
  NextResponse.json({ error: message }, { status })

export const unauthorizedResponse = () =>
  errorResponse('인증이 필요합니다.', 401)

export const forbiddenResponse = () =>
  errorResponse('권한이 없습니다.', 403)

export const notFoundResponse = () =>
  errorResponse('찾을 수 없습니다.', 404)

export const rateLimitResponse = () =>
  errorResponse('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', 429)

export const badRequestResponse = (message: string) =>
  errorResponse(message, 400)
```

## API Versioning Strategy

### URL Path Versioning (권장하지 않음 - 현재 미사용)

```
/api/v1/projects
/api/v2/projects
```

### Header-Based Versioning (필요시 도입)

```typescript
export async function GET(request: NextRequest) {
  const version = request.headers.get('API-Version') || '1'

  if (version === '2') {
    return handleV2Request(request)
  }
  return handleV1Request(request)
}
```

### Current Strategy: Additive Changes

현재 SideDish는 버저닝 없이 **추가적 변경(Additive Changes)** 전략을 사용:
- 새 필드 추가: OK (기존 클라이언트 영향 없음)
- 필드 제거: 지양 (deprecated 마킹 후 유지)
- 필드 타입 변경: 금지

## Pagination Patterns

### Cursor-Based Pagination (현재 사용)

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
  const cursor = searchParams.get('cursor')

  let query = db
    .collection(COLLECTIONS.PROJECTS)
    .orderBy('createdAt', 'desc')
    .limit(limit + 1)  // 다음 페이지 존재 확인용

  if (cursor) {
    const cursorDoc = await db.collection(COLLECTIONS.PROJECTS).doc(cursor).get()
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc)
    }
  }

  const snapshot = await query.get()
  const hasMore = snapshot.docs.length > limit
  const data = snapshot.docs.slice(0, limit).map(formatDoc)

  return NextResponse.json({
    data,
    nextCursor: hasMore ? data[data.length - 1].id : null,
    hasMore,
  })
}
```

### Offset Pagination (대안)

```typescript
// 작은 데이터셋에서만 사용 (성능 이슈)
const page = parseInt(searchParams.get('page') || '1')
const limit = 20
const offset = (page - 1) * limit

// Firestore에서는 offset이 비효율적 - cursor 권장
```

## Caching Strategy

### Client-Side Caching (api-client.ts)

```typescript
// 캐시 TTL 설정
const CACHE_TTL = {
  DEFAULT: 30 * 1000,        // 30초
  USER_PROFILE: 5 * 60 * 1000, // 5분
  AI_USAGE: 60 * 1000,       // 1분
  STATIC: 60 * 60 * 1000,    // 1시간
}

// 패턴 기반 캐시 무효화
invalidateCache('projects')  // 'projects'로 시작하는 모든 캐시 제거
```

### Server-Side Caching Headers

```typescript
export async function GET(request: NextRequest) {
  const data = await fetchData()

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  })
}
```

### Cache Invalidation Pattern

```typescript
// After mutation
await createProject(data)
invalidateCache('projects')  // Clear list cache

// After like toggle
await toggleLike(projectId)
invalidateCache(`projects/${projectId}`)  // Clear specific cache
```

## Security Checklist

### Every API Endpoint Must Have:

```typescript
// 1. Rate Limiting
const { allowed } = checkRateLimit(clientId, config)

// 2. Input Validation
const result = validateString(input, 'field', { required: true })

// 3. Authentication (for protected routes)
const authUser = await verifyAuth(request)

// 4. Authorization (for owner-only operations)
if (resource.authorId !== authUser.uid) return forbiddenResponse()

// 5. Output Sanitization (for user-generated content)
return { ...data, content: sanitizePlainText(data.content) }
```

## File Organization

```
src/
├── app/api/                    # API Routes
│   ├── projects/               # Resource
│   │   ├── route.ts           # Collection (GET list, POST create)
│   │   └── [id]/              # Item
│   │       ├── route.ts       # GET, PATCH, DELETE
│   │       └── like/route.ts  # Actions
│   └── ...
├── lib/
│   ├── api-client.ts          # Client-side API wrapper
│   ├── auth-utils.ts          # Authentication helpers
│   ├── security-utils.ts      # Validation functions
│   ├── rate-limiter.ts        # Rate limiting
│   ├── firebase-admin.ts      # Database access
│   ├── types.ts               # Frontend types
│   └── db-types.ts            # Database types
└── services/
    └── geminiService.ts       # Business logic services
```

## Anti-Patterns to Avoid

### ❌ Don't

```typescript
// 1. 여러 리소스를 하나의 엔드포인트에서 처리
POST /api/action?type=createProject  // Bad

// 2. GET 요청에 body 사용
GET /api/projects (body: { filter: 'web' })  // Bad

// 3. 동사 중심 URL
POST /api/createProject  // Bad
POST /api/deleteProject  // Bad

// 4. 중첩 깊이 3단계 초과
GET /api/users/123/projects/456/comments/789/replies  // Too deep
```

### ✅ Do

```typescript
// 1. 리소스 중심 URL
POST /api/projects  // Good

// 2. 쿼리 파라미터로 필터링
GET /api/projects?platform=WEB  // Good

// 3. 명사 중심 + HTTP 메서드
DELETE /api/projects/[id]  // Good

// 4. 적절한 중첩 (최대 2단계)
GET /api/projects/456/comments  // Good
```

## Documentation Standards

모든 API는 다음을 문서화:

```markdown
## [METHOD] /api/endpoint

### 목적
[이 엔드포인트가 하는 일]

### 인증
Required | Optional | None

### Request
- Query: `?param=value`
- Body: `{ field: type }`

### Response
- 200: `{ data }`
- 400: `{ error: "메시지" }`
- 401: `{ error: "인증이 필요합니다." }`

### 예시
```bash
curl -X POST /api/projects \
  -H "Authorization: Bearer token" \
  -d '{"title": "New Project"}'
```
```
