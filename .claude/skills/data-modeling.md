---
name: data-modeling-patterns
description: Firestore 데이터 모델링과 스키마 설계 패턴을 적용합니다. 새 컬렉션 추가, 관계 설계, 인덱스 최적화, 데이터 마이그레이션 시 사용하세요. NoSQL 특성에 맞는 비정규화 전략을 포함합니다.
allowed-tools: Read, Glob, Grep
---

# Data Modeling Skill

## Overview

SideDish는 Firebase Firestore(NoSQL)를 사용합니다. RDB와 달리 **비정규화**와 **읽기 최적화**가 핵심입니다.

## Current Schema

### Collections Overview

```
firestore/
├── projects        # 프로젝트 (메인 컬렉션)
├── users           # 사용자 프로필
├── comments        # 댓글 (별도 컬렉션)
├── whispers        # 비공개 피드백
├── ai_usage        # AI 사용량 추적
├── likes           # 좋아요 (복합키)
├── digests         # 뉴스레터 다이제스트
└── subscriptions   # 뉴스레터 구독
```

### Document Schemas

#### ProjectDoc (`projects`)

```typescript
interface ProjectDoc {
  // 식별자
  id: string                    // Firestore doc ID

  // 콘텐츠
  title: string                 // 최대 100자
  shortDescription: string      // 최대 80자 (태그라인)
  description: string           // 마크다운, 최대 10000자
  tags: string[]                // 최대 10개, 각 30자
  imageUrl: string              // Vercel Blob URL

  // 링크
  link: string                  // 프로젝트 URL (필수)
  githubUrl?: string            // GitHub URL (선택)

  // 메타데이터
  platform: 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'

  // 작성자 정보 (비정규화)
  authorId: string              // Firebase UID
  authorName: string            // 작성 시점 이름 (스냅샷)

  // 통계 (비정규화)
  likes: number                 // 좋아요 수 (캐시)
  reactions: {                  // 리액션 카운트
    fire?: number
    clap?: number
    party?: number
    idea?: number
    love?: number
  }

  // 타임스탬프
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### UserDoc (`users`)

```typescript
interface UserDoc {
  // 프로필
  name: string                  // 닉네임 (2-20자)
  avatarUrl: string             // 프로필 이미지 URL
  email?: string                // 이메일 (선택적 저장)
  role?: 'admin' | 'user'       // 역할 (관리자 여부)

  // 동의 내역
  agreements: {
    termsOfService: boolean     // 이용약관
    privacyPolicy: boolean      // 개인정보처리방침
    marketing: boolean          // 마케팅 동의
  }

  // 상태
  isProfileComplete: boolean    // 프로필 설정 완료 여부
  isWithdrawn: boolean          // 탈퇴 여부 (소프트 삭제)
  withdrawnAt?: Timestamp       // 탈퇴 시점
  withdrawalReason?: string     // 탈퇴 사유

  // 타임스탬프
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### CommentDoc (`comments`)

```typescript
interface CommentDoc {
  id: string
  projectId: string             // 대상 프로젝트

  // 작성자 (비정규화)
  authorId: string
  authorName: string
  authorAvatarUrl: string

  content: string               // 최대 1000자

  createdAt: Timestamp
  updatedAt: Timestamp
}
```

#### WhisperDoc (`whispers`)

```typescript
interface WhisperDoc {
  id: string
  projectId: string             // 대상 프로젝트
  projectAuthorId: string       // 프로젝트 작성자 (조회용)

  senderId: string              // 보낸 사람
  senderName: string            // 비정규화

  content: string               // 최대 2000자
  isRead: boolean               // 읽음 상태

  createdAt: Timestamp
}
```

## Design Patterns

### 1. Denormalization (비정규화)

NoSQL에서는 **조인이 없으므로** 자주 함께 조회되는 데이터를 임베딩합니다.

```typescript
// ✅ Good: 비정규화된 데이터
const project = {
  authorId: 'user123',
  authorName: '홍길동',        // 사용자 이름 복사
}

// 조회 시 단일 쿼리로 충분
const projectWithAuthor = await db.collection('projects').doc(id).get()

// ❌ Bad: 정규화된 데이터 (조인 필요)
const project = { authorId: 'user123' }
const user = await db.collection('users').doc(project.authorId).get()
```

**비정규화 업데이트 전략:**

```typescript
// 사용자 이름 변경 시 - 배치 업데이트
async function updateUserName(userId: string, newName: string) {
  const batch = db.batch()

  // 1. 사용자 문서 업데이트
  batch.update(db.collection('users').doc(userId), { name: newName })

  // 2. 관련 프로젝트 업데이트 (선택적 - 필요시)
  const projects = await db.collection('projects')
    .where('authorId', '==', userId)
    .get()

  projects.docs.forEach(doc => {
    batch.update(doc.ref, { authorName: newName })
  })

  await batch.commit()
}
```

### 2. Composite Keys (복합키)

좋아요처럼 고유성이 필요한 관계는 복합 문서 ID를 사용합니다.

```typescript
// likes 컬렉션
// Document ID: `${userId}_${projectId}`
interface LikeDoc {
  userId: string
  projectId: string
  createdAt: Timestamp
}

// 사용 예시
const likeId = `${userId}_${projectId}`
const likeRef = db.collection('likes').doc(likeId)

// 좋아요 존재 확인 - O(1)
const exists = (await likeRef.get()).exists

// 토글
if (exists) {
  await likeRef.delete()
} else {
  await likeRef.set({ userId, projectId, createdAt: Timestamp.now() })
}
```

### 3. Counter Pattern (카운터 패턴)

읽기 최적화를 위해 부모 문서에 카운트를 유지합니다.

```typescript
// 좋아요 토글 시 카운터 업데이트
import { FieldValue } from 'firebase-admin/firestore'

// 좋아요 추가
await db.collection('projects').doc(projectId).update({
  likes: FieldValue.increment(1),
})

// 좋아요 제거
await db.collection('projects').doc(projectId).update({
  likes: FieldValue.increment(-1),
})
```

**주의사항:**
- 카운터와 실제 데이터 불일치 가능성 있음
- 주기적 재계산 배치 작업 권장

### 4. Soft Delete (소프트 삭제)

법적 요구사항이나 복구 가능성을 위해 실제 삭제 대신 플래그를 사용합니다.

```typescript
// 사용자 탈퇴
await db.collection('users').doc(userId).update({
  isWithdrawn: true,
  withdrawnAt: Timestamp.now(),
  withdrawalReason: reason,
  // 개인정보 익명화
  name: '탈퇴한 사용자',
  email: FieldValue.delete(),
})

// 쿼리 시 제외
const activeUsers = await db.collection('users')
  .where('isWithdrawn', '!=', true)
  .get()
```

### 5. Timestamp Consistency

모든 문서에 일관된 타임스탬프 패턴을 적용합니다.

```typescript
import { Timestamp } from 'firebase-admin/firestore'

// 생성 시
const now = Timestamp.now()
const doc = {
  ...data,
  createdAt: now,
  updatedAt: now,
}

// 수정 시
await docRef.update({
  ...updates,
  updatedAt: Timestamp.now(),
})

// API 응답 변환
const response = {
  ...doc.data(),
  createdAt: doc.data().createdAt?.toDate().toISOString(),
  updatedAt: doc.data().updatedAt?.toDate().toISOString(),
}
```

## Indexing Strategy

### Automatic Indexes

Firestore는 단일 필드 인덱스를 자동 생성합니다.

```typescript
// 자동 인덱스 사용 가능
db.collection('projects').where('authorId', '==', userId)
db.collection('projects').orderBy('createdAt', 'desc')
```

### Composite Indexes

복합 쿼리에는 명시적 인덱스가 필요합니다.

```typescript
// 이 쿼리는 복합 인덱스 필요
db.collection('projects')
  .where('platform', '==', 'WEB')
  .orderBy('createdAt', 'desc')
```

**firestore.indexes.json:**

```json
{
  "indexes": [
    {
      "collectionGroup": "projects",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "platform", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "comments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "whispers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "projectAuthorId", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

## Schema Evolution

### Adding New Fields

```typescript
// 1. 선택적 필드로 추가 (기본값 처리)
interface ProjectDoc {
  // 기존 필드...
  newField?: string  // 선택적
}

// 2. 조회 시 기본값 처리
const project = {
  ...doc.data(),
  newField: doc.data().newField ?? 'default',
}

// 3. 마이그레이션 (필요시)
async function migrateProjects() {
  const batch = db.batch()
  const snapshot = await db.collection('projects').get()

  snapshot.docs.forEach(doc => {
    if (!doc.data().newField) {
      batch.update(doc.ref, { newField: 'default' })
    }
  })

  await batch.commit()
}
```

### Removing Fields

```typescript
// 1. 코드에서 필드 사용 중단
// 2. 일정 기간 후 마이그레이션으로 제거
async function removeDeprecatedField() {
  const batch = db.batch()
  const snapshot = await db.collection('projects').get()

  snapshot.docs.forEach(doc => {
    batch.update(doc.ref, {
      deprecatedField: FieldValue.delete(),
    })
  })

  await batch.commit()
}
```

### Renaming Fields

```typescript
// 1. 새 필드 추가 + 데이터 복사
// 2. 코드 업데이트
// 3. 이전 필드 제거
async function renameField() {
  const snapshot = await db.collection('projects').get()

  for (const doc of snapshot.docs) {
    const oldValue = doc.data().oldFieldName
    await doc.ref.update({
      newFieldName: oldValue,
      oldFieldName: FieldValue.delete(),
    })
  }
}
```

## Query Patterns

### Common Queries

```typescript
// 1. 사용자의 프로젝트 목록
db.collection('projects')
  .where('authorId', '==', userId)
  .orderBy('createdAt', 'desc')

// 2. 플랫폼별 프로젝트
db.collection('projects')
  .where('platform', '==', 'WEB')
  .orderBy('createdAt', 'desc')

// 3. 인기 프로젝트
db.collection('projects')
  .orderBy('likes', 'desc')
  .limit(10)

// 4. 프로젝트의 댓글
db.collection('comments')
  .where('projectId', '==', projectId)
  .orderBy('createdAt', 'desc')

// 5. 사용자에게 온 귓속말
db.collection('whispers')
  .where('projectAuthorId', '==', userId)
  .orderBy('createdAt', 'desc')
```

### Full-Text Search Limitation

Firestore는 전문 검색을 지원하지 않습니다. 현재 전략:

```typescript
// 클라이언트 사이드 필터링 (작은 데이터셋)
const snapshot = await db.collection('projects').get()
const results = snapshot.docs.filter(doc =>
  doc.data().title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  doc.data().description.toLowerCase().includes(searchTerm.toLowerCase())
)

// 대안: Algolia, Elasticsearch 연동 (대규모)
```

## Type Safety

### Frontend Types (`src/lib/types.ts`)

API 응답용 - Date는 string으로 직렬화됨

```typescript
interface Project {
  id: string
  title: string
  createdAt: Date  // 실제로는 string으로 받아서 변환
}
```

### Database Types (`src/lib/db-types.ts`)

Firestore 문서 구조 - Timestamp 사용

```typescript
interface ProjectDoc {
  id: string
  title: string
  createdAt: Timestamp
}

interface ProjectResponse {
  id: string
  title: string
  createdAt: string  // ISO 문자열
}
```

## Security Rules Pattern

```javascript
// firestore.rules (참고용)
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 프로젝트: 읽기 공개, 쓰기는 작성자만
    match /projects/{projectId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.authorId;
    }

    // 사용자: 본인만 읽기/쓰기
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // 댓글: 읽기 공개, 삭제는 작성자만
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
    }
  }
}
```

## Checklist: Adding New Collection

```markdown
1. [ ] db-types.ts에 Document 인터페이스 추가
2. [ ] types.ts에 Response 인터페이스 추가
3. [ ] firebase-admin.ts의 COLLECTIONS에 추가
4. [ ] API route 생성 (CRUD)
5. [ ] api-client.ts에 함수 추가
6. [ ] 필요시 복합 인덱스 추가
7. [ ] 보안 규칙 업데이트
8. [ ] 테스트 작성
```
