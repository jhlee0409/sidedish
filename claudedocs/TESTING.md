# SideDish 테스트 문서

> **2025 Firebase 아키텍처 고도화** 프로젝트의 완전한 테스트 스위트 문서

## 📋 목차

- [개요](#개요)
- [테스트 실행](#테스트-실행)
- [테스트 통계](#테스트-통계)
- [테스트 파일 구조](#테스트-파일-구조)
- [보안 테스트 계층](#보안-테스트-계층)
- [Firebase 에뮬레이터](#firebase-에뮬레이터)
- [테스트 작성 가이드](#테스트-작성-가이드)
- [트러블슈팅](#트러블슈팅)

---

## 개요

SideDish 프로젝트는 **Defense in Depth** 보안 철학을 기반으로 한 다층 보안 테스트를 포함합니다.

### 테스트 철학

1. **보안 우선**: 모든 입력은 악의적이라고 가정하고 검증
2. **Defense in Depth**: 여러 계층에서 보안 검증
3. **실제 시나리오**: 실제 공격 패턴을 기반으로 한 테스트
4. **자동화**: CI/CD 파이프라인에서 자동 실행

### 핵심 보안 원칙

```
┌─────────────────────────────────────────┐
│ Layer 1: Input Validation              │ ← security-utils
├─────────────────────────────────────────┤
│ Layer 2: XSS Prevention                │ ← sanitize-utils
├─────────────────────────────────────────┤
│ Layer 3: File Upload Security          │ ← file-validation
├─────────────────────────────────────────┤
│ Layer 4: Rate Limiting                 │ ← rate-limiter
├─────────────────────────────────────────┤
│ Layer 5: Authentication                │ ← auth-utils
├─────────────────────────────────────────┤
│ Layer 6: Middleware Security Headers   │ ← middleware
├─────────────────────────────────────────┤
│ Layer 7: Firestore Security Rules      │ ← firestore.rules
└─────────────────────────────────────────┘
```

---

## 테스트 실행

### 기본 명령어

```bash
# 모든 테스트 실행 (watch mode)
pnpm test

# 모든 테스트 한 번만 실행
pnpm test:run

# 커버리지 리포트와 함께 실행
pnpm test:coverage

# 특정 파일만 실행
pnpm test:run src/__tests__/security-utils.test.ts

# 특정 패턴 매칭
pnpm test:run security

# UI 모드로 실행
pnpm test --ui
```

### CI/CD 환경

```bash
# CI 환경에서 실행 (GitHub Actions 등)
CI=true pnpm test:run
```

---

## 테스트 통계

### 전체 현황

```
✅ Test Files  14 passed (14)
✅ Tests       283 passed
⏭️ Skipped     33 tests (firestore-rules - 에뮬레이터 필요)
❌ Failed      0 tests
⏱️ Duration    ~1초 (평균)
```

### 파일별 통계

| 파일 | 테스트 수 | 실행 시간 | 커버리지 영역 |
|------|-----------|-----------|---------------|
| **API & Server Actions** |
| api/projects.test.ts | 6 | ~35ms | REST API endpoints |
| actions/projects.test.ts | 18 | ~50ms | Server Actions |
| **보안 계층** |
| security-utils.test.ts | 36 | ~4ms | Input validation |
| sanitize-utils.test.ts | 5 | ~2ms | XSS prevention |
| file-validation.test.ts | 12 | ~2ms | File upload security |
| rate-limiter.test.ts | 21 | ~6ms | Rate limiting |
| auth-utils.test.ts | 10 | ~20ms | Authentication |
| middleware.test.ts | 16 | ~11ms | Security headers |
| **통합 테스트** |
| e2e-security.test.ts | 41 | ~20ms | End-to-end security |
| firestore-rules.test.ts | 33 | ~10ms | Firestore Security Rules |
| **Firebase** |
| firebase-admin.test.ts | 8 | ~70ms | Admin SDK |
| **스키마 검증** |
| schemas/common.test.ts | 47 | ~8ms | URL, tags, enums |
| schemas/project.test.ts | 31 | ~7ms | Project form |
| schemas/user.test.ts | 32 | ~7ms | User profile |

---

## 테스트 파일 구조

```
src/__tests__/
├── setup.ts                         # Vitest 설정
├── helpers/
│   └── mock-firebase.ts            # Firebase mocking 유틸리티
│
├── api/
│   └── projects.test.ts            # REST API 엔드포인트 테스트
│
├── actions/
│   └── projects.test.ts            # Server Actions 테스트
│
├── schemas/
│   ├── common.test.ts              # 공통 스키마 (URL, tags)
│   ├── project.test.ts             # 프로젝트 스키마
│   └── user.test.ts                # 사용자 스키마
│
├── security-utils.test.ts          # Input validation
├── sanitize-utils.test.ts          # XSS prevention
├── file-validation.test.ts         # File upload security
├── rate-limiter.test.ts            # Rate limiting
├── auth-utils.test.ts              # Authentication
├── middleware.test.ts              # Security headers
├── firebase-admin.test.ts          # Firebase Admin SDK
├── firestore-rules.test.ts         # Firestore Security Rules
└── e2e-security.test.ts            # E2E security integration
```

---

## 보안 테스트 계층

### Layer 1: Input Validation (security-utils.test.ts)

**목적**: 모든 사용자 입력의 기본 검증

**테스트 시나리오**:
```typescript
// 1. 문자열 검증
✓ 필수 필드 검증
✓ 길이 제한 (min/max)
✓ 빈 문자열 거부
✓ 화이트스페이스만 있는 문자열 거부

// 2. URL 검증
✓ HTTP/HTTPS만 허용
✓ javascript: 프로토콜 거부
✓ data: URI 거부
✓ 상대 경로 거부
✓ 잘못된 URL 형식 거부

// 3. Tags 검증
✓ 최대 개수 제한 (10개)
✓ 각 태그 길이 제한 (30자)
✓ 공백 자동 제거
✓ 소문자 변환
✓ 빈 태그 필터링

// 4. Enum 검증
✓ 유효한 값만 허용
✓ 대소문자 구분
✓ 잘못된 값 거부
```

**주요 상수**:
```typescript
CONTENT_LIMITS = {
  PROJECT_TITLE_MAX: 100,
  PROJECT_DESC_MAX: 10000,
  PROJECT_SHORT_DESC_MAX: 300,
  PROJECT_TAGS_MAX_COUNT: 10,
  PROJECT_TAG_MAX_LENGTH: 30,
  COMMENT_MAX: 1000,
  WHISPER_MAX: 2000,
}
```

---

### Layer 2: XSS Prevention (sanitize-utils.test.ts)

**목적**: Cross-Site Scripting 공격 방어

**테스트 시나리오**:
```typescript
// 1. 위험 패턴 탐지
✓ <script> 태그 탐지
✓ javascript: 프로토콜 탐지
✓ on* 이벤트 핸들러 탐지 (onclick, onerror 등)
✓ data: URI 탐지
✓ <iframe>, <object>, <embed> 탐지

// 2. HTML Sanitization (클라이언트만)
✓ 허용된 태그만 유지
✓ 위험한 속성 제거
✓ JavaScript 코드 제거
✓ 서버 측에서는 그대로 반환 (window === undefined)
```

**위험 패턴**:
```typescript
dangerousPatterns = [
  /<script/i,          // Script injection
  /javascript:/i,      // JavaScript protocol
  /on\w+\s*=/i,       // Event handlers
  /data:/i,            // Data URIs
  /<iframe/i,          // Inline frames
  /<object/i,          // Objects
  /<embed/i,           // Embeds
]
```

**중요**: `sanitizeHtml()`은 **클라이언트 측에서만** 작동합니다.
- 서버: 입력을 그대로 반환 → Layer 1 (URL validation) + Layer 2 (pattern detection)에 의존
- 클라이언트: DOMPurify로 HTML 정화

---

### Layer 3: File Upload Security (file-validation.test.ts)

**목적**: 악성 파일 업로드 방지

**테스트 시나리오**:
```typescript
// 1. Magic Number 검증
✓ JPEG: FF D8 FF
✓ PNG: 89 50 4E 47 0D 0A 1A 0A
✓ GIF: 47 49 46 38
✓ WebP: 52 49 46 46 ... 57 45 42 50

// 2. MIME Type 불일치 거부
✓ .jpg 확장자 + PNG 바이너리 → 거부
✓ .png 확장자 + JPEG 바이너리 → 거부

// 3. 최소 버퍼 크기
✓ 12 바이트 미만 거부 (MIN_BUFFER_SIZE = 12)
```

**보안 원리**:
```
사용자가 제공한 MIME type은 신뢰할 수 없음!
→ 파일 헤더의 Magic Number를 직접 검증

예시: 악성 스크립트를 image.jpg로 위장
1. 확장자: .jpg (통과)
2. Content-Type: image/jpeg (통과)
3. Magic Number: 23 21 2F ... (#!/... - 쉘 스크립트) → 거부!
```

---

### Layer 4: Rate Limiting (rate-limiter.test.ts)

**목적**: 과도한 요청 및 DoS 공격 방지

**테스트 시나리오**:
```typescript
// 1. 슬라이딩 윈도우
✓ 윈도우 내 요청 카운팅
✓ 윈도우 외 요청 만료
✓ 제한 초과 시 거부

// 2. 제한 수준별 테스트
✓ PUBLIC_READ: 60 req/min
✓ AUTHENTICATED_READ: 120 req/min
✓ AUTHENTICATED_WRITE: 30 req/min
✓ SENSITIVE: 5 req/hour
✓ UPLOAD: 10 req/min
✓ AI_GENERATE: 5 req/min

// 3. 클라이언트 식별
✓ User ID 우선
✓ IP 주소 fallback
✓ 조합 키 생성
```

**알고리즘**: Sliding Window
```
현재 시간: T
윈도우: T - W ~ T

요청 시간: [T-70s, T-40s, T-10s, T-5s]
윈도우(60s): T-60s ~ T
→ 카운트: 3개 (T-40s, T-10s, T-5s만 포함)
```

---

### Layer 5: Authentication (auth-utils.test.ts)

**목적**: Firebase ID Token 검증 및 인증

**테스트 시나리오**:
```typescript
// 1. Token 검증
✓ Bearer token 형식 검증
✓ 빈 토큰 거부
✓ 잘못된 형식 거부
✓ Firebase Admin Auth 검증

// 2. Middleware
✓ 인증 실패 시 401 반환
✓ 인증 성공 시 핸들러 실행
✓ User 데이터 전달

// 3. 응답 헬퍼
✓ unauthorizedResponse() - 401
✓ forbiddenResponse() - 403
```

**인증 흐름**:
```
1. Request Header에서 Authorization 추출
2. "Bearer {token}" 형식 검증
3. Firebase Admin Auth로 토큰 검증
4. DecodedIdToken 반환 (uid, email, name, picture)
5. 실패 시 null 반환
```

---

### Layer 6: Middleware Security Headers (middleware.test.ts)

**목적**: HTTP 보안 헤더 적용

**테스트 시나리오**:
```typescript
// 1. 보안 헤더 적용
✓ X-Frame-Options: DENY
✓ X-Content-Type-Options: nosniff
✓ Referrer-Policy: strict-origin-when-cross-origin
✓ Permissions-Policy: camera=(), microphone=(), geolocation=()

// 2. API 라우트 스킵
✓ /api/* 경로는 헤더 적용 안 함

// 3. Protected Routes
✓ /menu/register, /menu/edit/*, /mypage
✓ 현재는 클라이언트 측 AuthContext에서 처리
```

**보안 헤더 설명**:
```
X-Frame-Options: DENY
→ Clickjacking 방지 (iframe 삽입 차단)

X-Content-Type-Options: nosniff
→ MIME type sniffing 방지

Referrer-Policy: strict-origin-when-cross-origin
→ Referrer 정보 제어 (HTTPS → HTTP는 전송 안 함)

Permissions-Policy: camera=(), microphone=(), geolocation=()
→ 권한 정책 (카메라, 마이크, 위치 차단)
```

---

### Layer 7: Firestore Security Rules (firestore-rules.test.ts)

**목적**: 데이터베이스 레벨 접근 제어

**테스트 시나리오**:
```typescript
// Users Collection
✓ 모든 사용자가 프로필 읽기 가능
✓ 본인 프로필만 생성 가능
✓ 본인 프로필만 수정 가능
✓ role, createdAt 수정 불가
✓ 이름 길이 제한 (1-20자)

// Projects Collection
✓ 모든 사용자가 프로젝트 읽기 가능
✓ 인증된 사용자만 생성 가능
✓ authorId 불일치 방지
✓ 소유자만 수정/삭제 가능
✓ likes, reactions 직접 수정 불가
✓ 제목 길이 제한 (1-100자)
✓ 태그 개수 제한 (1-5개)

// Comments Collection
✓ 모든 사용자가 댓글 읽기 가능
✓ 인증된 사용자만 작성 가능
✓ 작성자만 삭제 가능
✓ 내용 길이 제한 (1-1000자)

// Whispers Collection
✓ 프로젝트 작성자만 읽기 가능
✓ 인증된 사용자만 작성 가능
✓ 프로젝트 작성자만 읽음 표시 가능
✓ 작성 후 내용 수정 불가
✓ 내용 길이 제한 (1-2000자)

// Likes Collection
✓ 모든 사용자가 읽기 가능
✓ 인증된 사용자만 좋아요 가능
✓ 본인 좋아요만 삭제 가능
✓ 타인 좋아요 삭제 불가
```

**중요**: 이 테스트는 **Firebase 에뮬레이터**가 필요합니다.
- 에뮬레이터 없이는 33개 테스트가 graceful skip됩니다.
- 실제 Security Rules 검증을 위해서는 에뮬레이터 실행 필요

### ⚠️ stderr 출력에 대해

Firestore Rules 테스트 실행 시 많은 `PERMISSION_DENIED` 에러 메시지가 stderr에 출력됩니다:

```
stderr | src/__tests__/firestore-rules.test.ts > Users Collection Security Rules > should prevent users from creating profiles with different user IDs
[2025-12-26T11:50:43.909Z]  @firebase/firestore: Firestore (12.6.0): GrpcConnection RPC 'Write' stream 0x7ee27ced error. Code: 7 Message: 7 PERMISSION_DENIED:
false for 'create' @ L57, false for 'create' @ L69...
```

**이것은 정상이며 예상된 동작입니다!** ✅

- 테스트가 **의도적으로 보안 규칙 위반을 시도**합니다
- Firestore가 올바르게 차단하는지 확인하는 것입니다
- `"should prevent..."` 테스트들이 이런 에러를 유발합니다

**예시:**
```typescript
// 테스트: "should prevent users from creating profiles with different user IDs"
it('should prevent users from creating profiles with different user IDs', async () => {
  const db = testEnv.authenticatedContext('user-1')
  const otherUserRef = db.collection('users').doc('user-2')

  // 의도적으로 다른 사용자 ID로 프로필 생성 시도
  // → Firestore가 PERMISSION_DENIED로 차단해야 함
  await expectPermissionDenied(
    otherUserRef.set({ name: 'Hacker' })
  )
  // ✅ 테스트 통과 = 보안이 제대로 작동함
})
```

**따라서:**
- stderr에 `PERMISSION_DENIED` 에러가 많이 보여도 걱정하지 마세요
- 모든 테스트가 통과(`✓`)하면 보안 규칙이 올바르게 작동하는 것입니다
- 에러 메시지는 보안 규칙이 **제대로 차단하고 있다는 증거**입니다

---

## Firebase 에뮬레이터

### 설치 및 시작

```bash
# Firebase CLI 설치
npm install -g firebase-tools

# 로그인
firebase login

# 프로젝트 초기화 (이미 되어있으면 스킵)
firebase init

# Firestore 에뮬레이터만 시작
firebase emulators:start --only firestore

# 브라우저로 UI 확인
open http://localhost:4000
```

### 에뮬레이터와 함께 테스트

```bash
# Terminal 1: 에뮬레이터 시작
firebase emulators:start --only firestore

# Terminal 2: 테스트 실행
pnpm test firestore-rules

# 모든 테스트 실행
pnpm test:run
```

### Firestore 에뮬레이터 포트

- Firestore: `localhost:8080`
- UI: `localhost:4000`

### 에뮬레이터 없이 테스트

현재 구현은 에뮬레이터가 없어도 graceful하게 스킵됩니다:

```bash
pnpm test:run
# ⚠️  Firebase Emulator not running - skipping Firestore Rules tests
#    Start emulator: firebase emulators:start --only firestore
# ✓ 33 tests skipped
```

---

## 테스트 작성 가이드

### 1. 새 보안 유틸리티 추가 시

```typescript
// src/lib/new-security-util.ts
export function validateSomething(input: unknown): ValidationResult {
  // 구현
}

// src/__tests__/new-security-util.test.ts
import { describe, it, expect } from 'vitest'
import { validateSomething } from '@/lib/new-security-util'

describe('New Security Util', () => {
  describe('validateSomething', () => {
    it('should accept valid input', () => {
      const result = validateSomething('valid')
      expect(result.valid).toBe(true)
    })

    it('should reject invalid input', () => {
      const result = validateSomething('invalid')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('expected error message')
    })

    it('should handle edge cases', () => {
      expect(validateSomething(null).valid).toBe(false)
      expect(validateSomething(undefined).valid).toBe(false)
      expect(validateSomething('').valid).toBe(false)
    })
  })
})
```

### 2. 새 API 엔드포인트 추가 시

```typescript
// src/app/api/something/route.ts
export async function POST(request: NextRequest) {
  // 구현
}

// src/__tests__/api/something.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/something/route'

// Firebase mocking
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
      })),
    })),
  })),
}))

describe('Something API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should require authentication', async () => {
    const request = new Request('http://localhost/api/something')
    const response = await POST(request as any)
    expect(response.status).toBe(401)
  })

  it('should validate input', async () => {
    // Mock authenticated user
    vi.mock('@/lib/auth-utils', () => ({
      verifyAuth: vi.fn(() => ({ uid: 'user-1' })),
    }))

    const request = new Request('http://localhost/api/something', {
      method: 'POST',
      body: JSON.stringify({ invalid: 'data' }),
    })
    const response = await POST(request as any)
    expect(response.status).toBe(400)
  })
})
```

### 3. E2E 시나리오 추가 시

```typescript
// src/__tests__/e2e-security.test.ts에 추가
describe('E2E Security Integration', () => {
  describe('New Attack Vector', () => {
    it('should defend against specific attack', () => {
      // Layer 1: Input validation
      const validation = validateInput(maliciousInput)
      expect(validation.valid).toBe(false)

      // Layer 2: Pattern detection
      expect(containsDangerousPatterns(maliciousInput)).toBe(true)

      // Layer 3: Sanitization (클라이언트만)
      // ...
    })
  })
})
```

---

## 트러블슈팅

### 문제 1: server-only 모듈 에러

**증상**:
```
Error: This module cannot be imported from a Client Component module.
It should only be used from a Server Component.
```

**원인**: Vitest는 Node.js 환경이지만 `server-only` 패키지가 클라이언트 컴포넌트로 인식

**해결**:
```typescript
// src/__tests__/setup.ts
vi.mock('server-only', () => ({}))
```

---

### 문제 2: Firebase 에뮬레이터 연결 실패

**증상**:
```
TypeError: fetch failed
Caused by: AggregateError
  Error: connect ECONNREFUSED ::1:8080
```

**원인**: Firebase 에뮬레이터가 실행되지 않음

**해결**:
```bash
# Terminal 1
firebase emulators:start --only firestore

# Terminal 2
pnpm test firestore-rules
```

**또는** graceful skip이 활성화되어 있으므로 무시 가능:
```
⚠️  Firebase Emulator not running - skipping Firestore Rules tests
✓ 33 tests skipped
```

---

### 문제 3: 테스트 실패 - Validation 값 불일치

**증상**:
```
AssertionError: expected 'react' to equal 'React'
```

**원인**: 실제 구현과 테스트 기대값 불일치

**해결**:
1. 실제 구현 확인:
```typescript
// src/lib/security-utils.ts
const trimmed = tag.trim().toLowerCase() // 소문자 변환됨!
```

2. 테스트 수정:
```typescript
// BEFORE
expect(result.value).toEqual(['React', 'TypeScript'])

// AFTER
expect(result.value).toEqual(['react', 'typescript'])
```

**교훈**: 항상 실제 구현을 읽고 테스트 작성!

---

### 문제 4: Mock이 작동하지 않음

**증상**:
```
TypeError: Cannot read properties of undefined (reading 'collection')
```

**원인**: Firebase Admin SDK가 제대로 mock되지 않음

**해결**:
```typescript
// 올바른 mock 구조
vi.mock('@/lib/firebase-admin', () => ({
  getAdminDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      doc: vi.fn(() => ({
        set: vi.fn(),
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        get: vi.fn(),
      })),
    })),
  })),
  COLLECTIONS: {
    PROJECTS: 'projects',
    USERS: 'users',
  },
}))
```

---

### 문제 5: 특정 테스트만 실행하고 싶을 때

```bash
# 파일 이름으로 필터링
pnpm test security

# 특정 describe 블록만
pnpm test -t "Input Validation"

# 특정 it 테스트만
pnpm test -t "should validate email"

# 파일 경로 직접 지정
pnpm test src/__tests__/security-utils.test.ts
```

---

## 테스트 Best Practices

### ✅ DO

```typescript
// 1. 명확한 테스트 이름
it('should reject tags longer than 30 characters', () => {
  // ...
})

// 2. AAA 패턴 (Arrange, Act, Assert)
it('should validate URL', () => {
  // Arrange
  const input = 'javascript:alert(1)'

  // Act
  const result = validateUrl(input, 'link')

  // Assert
  expect(result.valid).toBe(false)
})

// 3. Edge cases 테스트
it('should handle edge cases', () => {
  expect(validate(null).valid).toBe(false)
  expect(validate(undefined).valid).toBe(false)
  expect(validate('').valid).toBe(false)
  expect(validate('   ').valid).toBe(false)
})

// 4. 에러 메시지 검증
it('should return descriptive error message', () => {
  const result = validateTags(tooManyTags)
  expect(result.error).toContain('10개 이하')
})
```

### ❌ DON'T

```typescript
// 1. 모호한 테스트 이름
it('should work', () => {
  // ...
})

// 2. 여러 개념을 한 테스트에
it('should validate everything', () => {
  // URL 검증
  // Tags 검증
  // 파일 검증
  // ...
})

// 3. 하드코딩된 값
it('should reject long input', () => {
  const input = 'a'.repeat(101) // 왜 101인지 불명확
  expect(validate(input).valid).toBe(false)
})

// 올바른 방법
it('should reject input longer than PROJECT_TITLE_MAX', () => {
  const input = 'a'.repeat(CONTENT_LIMITS.PROJECT_TITLE_MAX + 1)
  expect(validate(input).valid).toBe(false)
  expect(result.error).toContain(`${CONTENT_LIMITS.PROJECT_TITLE_MAX}자`)
})

// 4. 실제 구현 확인 없이 테스트 작성
// → 항상 실제 코드를 읽고 테스트!
```

---

## 지속적인 개선

### 테스트 추가가 필요한 영역

1. **Integration Tests**
   - API → Firestore → 응답 전체 흐름
   - 파일 업로드 → 검증 → Vercel Blob 저장

2. **Performance Tests**
   - Rate limiter 성능
   - 대용량 데이터 처리

3. **Visual Regression Tests**
   - Playwright로 UI 스크린샷 비교

4. **Accessibility Tests**
   - @testing-library/jest-dom으로 a11y 검증

---

## 참고 자료

### 공식 문서
- [Vitest](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Firebase Testing](https://firebase.google.com/docs/rules/unit-tests)

### 보안 참고
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

### 프로젝트 문서
- [FIREBASE_UPGRADE_GUIDE.md](../FIREBASE_UPGRADE_GUIDE.md)
- [CLAUDE.md](../CLAUDE.md)

---

**마지막 업데이트**: 2025-01-01
**작성자**: Claude AI (Anthropic)
**버전**: 1.0.0
