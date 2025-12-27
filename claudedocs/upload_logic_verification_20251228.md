# 업로드 로직 전체 검증 보고서
**작성일**: 2025-12-28
**검증자**: Claude Code
**검증 범위**: 이미지 업로드, 삭제, 메타데이터 관리 전체 로직

---

## Executive Summary

### ✅ 검증 완료 항목
1. POST /api/upload 엔드포인트 검증
2. 모든 클라이언트 업로드 호출 검증
3. 이미지 삭제 로직 전체 검증
4. uploads collection 메타데이터 일관성 검증

### 🔧 수정 완료 사항
1. **Firestore undefined 값 오류 수정** (src/app/api/upload/route.ts:155-166)
2. **uploads 메타데이터 삭제 누락 수정** (4개 위치)
   - src/app/api/upload/delete/route.ts
   - src/app/api/users/[id]/route.ts
   - src/app/api/projects/[id]/route.ts (2곳)

### 📊 최종 상태
- **빌드 상태**: ✅ 성공
- **테스트 상태**: ✅ 23/23 통과 (upload tests)
- **프로덕션 준비도**: ✅ 배포 가능

---

## 1. POST /api/upload 엔드포인트 검증

### 파일 위치
`src/app/api/upload/route.ts`

### 검증 결과

#### ✅ 인증 및 권한 검증
```typescript
const user = await verifyAuth(request)  // line 63
if (!user) return unauthorizedResponse()

// 프로필 업로드: 본인만 가능
if (type === 'profile' && entityId !== user.uid) {
  return NextResponse.json({ error: '자신의 프로필 사진만 업로드할 수 있습니다.' }, { status: 403 })
}
```

#### ✅ Rate Limiting
```typescript
const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.UPLOAD)
// 10 req/min per user
```

#### ✅ 파일 검증
- 파일 타입: JPEG, PNG, WebP, GIF
- 파일 크기: 5MB 이하
- Magic number 검증 (line 127-134)

#### ✅ 이미지 최적화
- Sharp를 사용한 WebP 변환
- 최대 너비 1200px 리사이즈
- GIF는 원본 유지 (애니메이션 보존)

#### 🔧 **수정 완료: Firestore undefined 값 오류**

**Before (BROKEN)**:
```typescript
draftId: type === 'project' ? entityId : undefined,  // ❌ Firestore rejects undefined
projectId: undefined,  // ❌ Always undefined
```

**After (FIXED)**:
```typescript
const uploadMetadata: UploadMetadataDoc = {
  id: uploadId,
  url: blob.url,
  userId: user.uid,
  type: type as 'profile' | 'project',
  uploadedAt: Timestamp.now(),
  status: 'pending',
  fileSize: optimizedBuffer.length,
  mimeType: blob.contentType || (file.type === 'image/gif' ? 'image/gif' : 'image/webp'),
  // ✅ Conditionally add draftId only for project uploads
  ...(type === 'project' && { draftId: entityId }),
}
```

**Impact**: 프로필 이미지 업로드 오류 완전 해결

---

## 2. 클라이언트 업로드 호출 검증

### 검증 대상 파일
1. src/lib/api-client.ts (uploadImage 함수)
2. src/hooks/useImageUpload.ts (레거시 훅)
3. src/components/ProfileEditModal.tsx
4. src/components/SignupProfileForm.tsx
5. src/app/menu/register/page.tsx
6. src/app/menu/edit/[id]/page.tsx

### 검증 결과

#### ✅ api-client.uploadImage 함수 (권장 방법)

**src/lib/api-client.ts:1076-1100**
```typescript
export async function uploadImage(
  file: File,
  type: 'profile' | 'project',
  entityId: string
): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('type', type)
  formData.append('entityId', entityId)

  const headers: HeadersInit = {}
  if (getIdToken) {
    const token = await getIdToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`  // ✅ 인증 헤더 추가
    }
  }

  const response = await fetch('/api/upload', {
    method: 'POST',
    headers,
    body: formData,
  })
  return handleResponse<{ url: string }>(response)
}
```

#### ✅ 모든 컴포넌트에서 api-client.uploadImage 정확히 사용

| 파일 | 라인 | 코드 | 상태 |
|------|------|------|------|
| ProfileEditModal.tsx | 144 | `uploadImage(file, 'profile', user.id)` | ✅ |
| SignupProfileForm.tsx | 146 | `uploadImage(file, 'profile', firebaseUser.uid)` | ✅ |
| menu/register/page.tsx | 362 | `uploadImage(selectedFile, 'project', draft.id)` | ✅ |
| menu/edit/[id]/page.tsx | 376 | `uploadImage(selectedFile, 'project', id)` | ✅ |

#### ⚠️ 레거시 코드 발견: useImageUpload 훅

**src/hooks/useImageUpload.ts:95-127**
```typescript
const uploadImage = useCallback(async (type: UploadType, entityId: string): Promise<string | null> => {
  // ...
  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,  // ❌ Authorization 헤더 없음
  })
  // ...
}, [selectedFile, handleError])
```

**문제점**:
- Authorization 헤더 누락
- 인증되지 않은 요청으로 401 에러 발생 가능

**현재 상태**:
- ✅ **사용되지 않음** - 모든 컴포넌트가 api-client.uploadImage 직접 호출
- 향후 제거 권장

---

## 3. 이미지 삭제 로직 검증

### 삭제가 발생하는 4가지 시나리오

| 시나리오 | 파일 | 라인 | Blob 삭제 | 메타데이터 삭제 | 상태 |
|---------|------|------|-----------|----------------|------|
| 1. 수동 삭제 | upload/delete/route.ts | 69, 72-78 | ✅ | 🔧 추가 완료 | ✅ |
| 2. 프로필 교체 | users/[id]/route.ts | 211, 216 | ✅ | ✅ 이미 있음 | ✅ |
| 3. 프로젝트 이미지 교체 | projects/[id]/route.ts (PATCH) | 133, 138 | ✅ | ✅ 이미 있음 | ✅ |
| 4. 프로젝트 삭제 | projects/[id]/route.ts (DELETE) | 215, 220 | ✅ | ✅ 이미 있음 | ✅ |

### 🔧 수정 완료: /api/upload/delete 메타데이터 삭제 누락

**Before (MISSING)**:
```typescript
// Delete file from Vercel Blob
await del(url)

return NextResponse.json({ success: true })  // ❌ 메타데이터 삭제 없음
```

**After (FIXED)**:
```typescript
// Delete file from Vercel Blob
await del(url)

// uploads collection 메타데이터 삭제
const uploadId = new URL(url).pathname.split('/').pop()
if (uploadId) {
  const adminDb = getAdminDb()
  await adminDb.collection('uploads').doc(uploadId).delete().catch((err) => {
    console.error('Failed to delete upload metadata:', err)
  })
}

return NextResponse.json({ success: true })
```

**참고**: `/api/upload/delete` 엔드포인트는 현재 클라이언트에서 **사용되지 않음**. 향후 사용을 위해 수정 완료.

---

## 4. uploads collection 메타데이터 일관성

### 메타데이터 구조 일관성

#### ✅ 생성 시점 (POST /api/upload)
```typescript
interface UploadMetadataDoc {
  id: string                    // URL에서 추출한 파일명
  url: string                   // Vercel Blob URL
  userId: string                // 업로드한 사용자 ID
  type: 'profile' | 'project'   // 업로드 타입
  uploadedAt: Timestamp         // 업로드 시각
  status: 'pending'             // 초기 상태
  fileSize: number              // 파일 크기 (bytes)
  mimeType: string              // MIME 타입
  draftId?: string              // 프로젝트 업로드만 (조건부)
}
```

### uploadId 추출 방법 일관성

#### ✅ 모든 위치에서 동일한 패턴 사용

```typescript
const uploadId = new URL(url).pathname.split('/').pop()
```

**사용 위치**:
- src/app/api/upload/route.ts:151 (생성 시 - fallback 있음)
- src/app/api/upload/delete/route.ts:72
- src/app/api/users/[id]/route.ts:214
- src/app/api/projects/[id]/route.ts:136
- src/app/api/projects/[id]/route.ts:218

### 에러 처리 일관성

#### ✅ 모든 삭제 위치에서 동일한 에러 처리

```typescript
await db.collection('uploads').doc(uploadId).delete().catch((err) => {
  console.error('Failed to delete upload metadata:', err)
})
```

**특징**:
- 메타데이터 삭제 실패 시에도 메인 작업은 계속 진행
- 에러는 로그만 남기고 사용자에게 노출하지 않음
- 비치명적 오류로 처리

---

## 5. 파일 변경 사항 요약

### Modified Files

1. **src/app/api/upload/route.ts**
   - Firestore undefined 값 오류 수정
   - 조건부 필드 추가 패턴 적용

2. **src/app/api/upload/delete/route.ts**
   - uploads 메타데이터 삭제 로직 추가

3. **src/app/api/users/[id]/route.ts**
   - uploads 메타데이터 삭제 로직 추가 (이전 수정)

4. **src/app/api/projects/[id]/route.ts**
   - uploads 메타데이터 삭제 로직 추가 (2곳, 이전 수정)

### Build Verification
```bash
pnpm build
```
**결과**: ✅ 성공

### Test Verification
```bash
pnpm test
```
**결과**: ✅ 23/23 upload tests passed

---

## 6. 발견된 레거시 코드

### 사용되지 않는 코드

1. **src/hooks/useImageUpload.ts**
   - Authorization 헤더 없이 직접 fetch 호출
   - 모든 컴포넌트가 api-client.uploadImage 사용
   - **권장**: 향후 제거

2. **/api/upload/delete 엔드포인트**
   - 클라이언트에서 호출하는 코드 없음
   - 메타데이터 삭제 로직 추가 완료
   - **권장**: 유지 (향후 사용 가능)

---

## 7. 업로드 프로세스 흐름도

### 프로필 이미지 업로드 (즉시 업로드)

```
[사용자] → [파일 선택] → [크롭 모달]
                              ↓
                        [Blob 변환]
                              ↓
                   [api-client.uploadImage]
                              ↓
              [POST /api/upload (Auth + RateLimit)]
                              ↓
          [Magic Number 검증 + Sharp 최적화]
                              ↓
                    [Vercel Blob 업로드]
                              ↓
                [Firestore uploads 메타데이터 저장]
                              ↓
                    [URL 반환 → UI 업데이트]
```

### 프로젝트 이미지 업로드 (pre-submit)

```
[사용자] → [파일 선택] → [프리뷰 표시]
                              ↓
                [폼 제출 (프로젝트 저장)]
                              ↓
              [이미지가 있으면 uploadImage 호출]
                              ↓
              [POST /api/upload (draftId 사용)]
                              ↓
          [Vercel Blob + uploads 메타데이터 저장]
                              ↓
          [POST /api/projects (imageUrl 포함)]
                              ↓
                [프로젝트 생성 완료]
```

### 이미지 교체 (기존 이미지 삭제)

```
[이미지 교체 요청]
       ↓
[새 이미지 업로드] → [새 URL 받음]
       ↓
[PATCH /api/users/[id] 또는 /api/projects/[id]]
       ↓
[이전 imageUrl과 비교]
       ↓
[다르면] → [del(oldUrl)] → [Vercel Blob 삭제]
                               ↓
                    [uploads 메타데이터 삭제]
                               ↓
                    [새 URL로 DB 업데이트]
```

---

## 8. 보안 및 검증 체크리스트

### ✅ 인증 및 권한
- [x] POST /api/upload - verifyAuth 검증
- [x] DELETE /api/upload/delete - verifyAuth + 본인 확인
- [x] PATCH /api/users/[id] - 본인만 수정 가능
- [x] PATCH /api/projects/[id] - 프로젝트 소유자만 수정

### ✅ 입력 검증
- [x] 파일 타입 검증 (MIME type)
- [x] 파일 크기 검증 (5MB)
- [x] Magic number 검증 (파일 내용 일치)
- [x] entityId 검증 (빈 문자열 차단)

### ✅ Rate Limiting
- [x] 10 req/min per user (업로드)

### ✅ 에러 처리
- [x] 모든 엔드포인트에 try-catch
- [x] handleApiError 통합 에러 처리
- [x] 사용자 친화적 에러 메시지 (한국어)

### ✅ 데이터 일관성
- [x] Firestore undefined 값 회피
- [x] Blob 삭제 + 메타데이터 삭제 동시 수행
- [x] 일관된 uploadId 추출 방법
- [x] 일관된 에러 처리 패턴

---

## 9. 결론 및 권장사항

### 현재 상태
- ✅ **모든 업로드 로직 검증 완료**
- ✅ **Critical 버그 2개 수정 완료**
- ✅ **빌드 성공, 테스트 통과**
- ✅ **프로덕션 배포 가능**

### 권장사항

#### 1. 즉시 조치 (선택 사항)
- [ ] **useImageUpload.ts 제거** - 사용되지 않는 레거시 코드
  ```bash
  rm src/hooks/useImageUpload.ts
  # src/hooks/index.ts에서 export 제거
  ```

#### 2. 향후 고려 사항
- [ ] **Orphaned uploads 정리** - status='pending'인 uploads 주기적 정리 (Cron job)
- [ ] **Upload progress tracking** - 대용량 파일 업로드 진행률 표시
- [ ] **Image CDN caching** - Vercel Blob URL에 CDN 캐싱 최적화

#### 3. 모니터링 항목
- uploads collection 크기 모니터링
- 메타데이터 삭제 실패 로그 모니터링
- 업로드 성공률 추적

---

## 10. 검증 완료 체크리스트

### Core Verification
- [x] POST /api/upload 엔드포인트 검증
- [x] 클라이언트 uploadImage 호출 검증
- [x] 이미지 삭제 로직 검증 (4개 시나리오)
- [x] uploads 메타데이터 일관성 검증

### Bug Fixes
- [x] Firestore undefined 값 오류 수정
- [x] uploads 메타데이터 삭제 누락 수정 (4곳)

### Quality Assurance
- [x] 빌드 검증 (pnpm build)
- [x] 테스트 검증 (23/23 passed)
- [x] 코드 일관성 검증
- [x] 보안 체크리스트 검증

### Documentation
- [x] 검증 보고서 작성
- [x] 파일 변경 사항 문서화
- [x] 프로세스 흐름도 작성

---

**검증 완료**: 2025-12-28
**최종 상태**: ✅ 프로덕션 배포 가능
