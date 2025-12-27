# 이미지 업로드 토스트 및 블롭 스토리지 업로드 시점 분석

**분석 일시**: 2025-12-28
**목적**: 이미지 업로드 시 토스트 표시 일관성 검토 및 4개 케이스별 업로드 프로세스 파악

---

## 📊 현재 상태 요약

### 토스트 표시 현황

| 케이스 | 업로드 성공 토스트 | 업로드 실패 토스트 | 일관성 |
|--------|-------------------|-------------------|--------|
| **1. 회원가입 프로필 설정** | ❌ 없음 | ❌ 없음 (상태로만 표시) | 🔴 |
| **2. 프로필 수정** | ✅ "프로필 사진이 변경되었습니다." | ✅ "이미지 업로드에 실패했습니다." | 🟢 |
| **3. 프로젝트 등록** | ❌ 없음 | ✅ "이미지 업로드에 실패했습니다." | 🟡 |
| **4. 프로젝트 수정** | ❌ 없음 | ✅ "이미지 업로드에 실패했습니다." | 🟡 |

### 문제점

1. **일관성 부족**: 프로필 수정만 성공 토스트가 있고, 나머지는 없음
2. **사용자 피드백 부족**: 프로젝트 이미지 업로드 성공 시 피드백이 없어 완료 여부 불명확
3. **회원가입 특이사항**: 에러도 토스트가 아닌 폼 상태로만 표시

---

## 🔍 케이스별 상세 분석

### 1️⃣ 회원가입 프로필 설정

**파일**: `src/components/SignupProfileForm.tsx`

#### 업로드 시점
```
사용자 이미지 선택
→ 크롭 완료
→ 즉시 Blob 스토리지에 업로드 (line 146)
→ avatarUrl 폼 필드 업데이트
→ "회원가입 완료" 버튼 클릭
→ updateUser API 호출 (이미 업로드된 URL 포함)
```

#### 사용하는 API
- **업로드**: `uploadImage(file, 'profile', firebaseUser.uid)`
  - entityId: `firebaseUser.uid` (Firebase 사용자 ID)
  - Firestore uploads collection에 메타데이터 저장
  - status: 'pending'

#### 토스트 동작
- **성공 시**: ❌ 토스트 없음
- **실패 시**: ❌ 토스트 없음, `setUploadError()` 상태만 설정 (line 152)
  ```tsx
  } catch (err) {
    console.error('Image upload error:', err)
    setUploadError('이미지 업로드에 실패했습니다.')
  }
  ```

#### 특이사항
- 이미지 업로드 에러를 폼 내부 에러 메시지로만 표시
- 토스트를 사용하지 않음 (의도적 설계로 보임)

---

### 2️⃣ 프로필 수정

**파일**: `src/components/ProfileEditModal.tsx`

#### 업로드 시점
```
사용자 이미지 선택
→ 크롭 완료
→ 즉시 Blob 스토리지에 업로드 (line 144)
→ ✅ 성공 토스트 표시
→ avatarUrl 폼 필드 업데이트
→ "저장" 버튼 클릭
→ updateUser API 호출 (이미 업로드된 URL 포함)
→ ✅ "프로필이 수정되었습니다." 토스트
```

#### 사용하는 API
- **업로드**: `uploadImage(file, 'profile', user.id)`
  - entityId: `user.id` (Firestore 사용자 문서 ID)
  - Firestore uploads collection에 메타데이터 저장
  - status: 'pending'

#### 토스트 동작
- **업로드 성공 시**: ✅ `toast.success('프로필 사진이 변경되었습니다.')` (line 146)
- **업로드 실패 시**: ✅ `toast.error('이미지 업로드에 실패했습니다.')` (line 151)
- **프로필 저장 성공 시**: ✅ `toast.success('프로필이 수정되었습니다.')` (line 199)
- **프로필 저장 실패 시**: ✅ `toast.error('프로필 수정에 실패했습니다.')` (line 204)

#### 특이사항
- **유일하게 업로드 성공 토스트를 표시하는 케이스**
- 이미지 업로드와 프로필 저장이 분리되어 있어 2번의 성공 토스트 가능

---

### 3️⃣ 프로젝트 등록

**파일**: `src/app/menu/register/page.tsx`

#### 업로드 시점
```
사용자 이미지 선택
→ 프리뷰 표시 (로컬 state)
→ "메뉴 등록" 버튼 클릭
→ Draft ID 기준으로 Blob 스토리지에 업로드 (line 362)
→ 업로드 실패 시 프로세스 중단 (return)
→ createProject API 호출 (업로드된 imageUrl 포함)
→ 프로젝트 생성 성공 → 상세 페이지로 이동 (토스트 없음)
```

#### 사용하는 API
- **업로드**: `uploadImage(selectedFile, 'project', draft.id)`
  - entityId: `draft.id` (클라이언트에서 생성한 임시 Draft ID - **UUIDv7**)
  - Firestore uploads collection에 메타데이터 저장
  - draftId: draft.id
  - projectId: undefined (프로젝트 생성 전)
  - status: 'pending'

#### 토스트 동작
- **업로드 성공 시**: ❌ 토스트 없음
- **업로드 실패 시**: ✅ `toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')` (line 366)
- **프로젝트 생성 실패 시**: ✅ `toast.error('메뉴 등록에 실패했습니다. 다시 시도해주세요.')` (line 410)

#### 특이사항
- **Pre-upload 패턴**: 프로젝트 생성 전에 이미지를 먼저 업로드
- Draft ID를 entityId로 사용 (프로젝트 ID가 아직 없음)
- 업로드 성공해도 토스트 없이 바로 프로젝트 생성으로 진행
- 프로젝트 생성 성공 시 페이지 이동만 하고 토스트 없음

---

### 4️⃣ 프로젝트 수정

**파일**: `src/app/menu/edit/[id]/page.tsx`

#### 업로드 시점
```
사용자 이미지 선택
→ 프리뷰 표시 (로컬 state)
→ "수정 완료" 버튼 클릭
→ 실제 프로젝트 ID 기준으로 Blob 스토리지에 업로드 (line 376)
→ 업로드 실패 시 프로세스 중단 (return)
→ updateProject API 호출 (업로드된 imageUrl 포함)
→ 프로젝트 수정 성공 → 마이페이지로 이동 (토스트 없음)
```

#### 사용하는 API
- **업로드**: `uploadImage(selectedFile, 'project', id)`
  - entityId: `id` (실제 프로젝트 ID)
  - Firestore uploads collection에 메타데이터 저장
  - draftId: id (프로젝트 ID를 draftId로 저장)
  - projectId: undefined
  - status: 'pending'

#### 토스트 동작
- **업로드 성공 시**: ❌ 토스트 없음
- **업로드 실패 시**: ✅ `toast.error('이미지 업로드에 실패했습니다. 다시 시도해주세요.')` (line 380)
- **프로젝트 수정 실패 시**: ✅ `toast.error('메뉴 수정에 실패했습니다. 다시 시도해주세요.')` (line 410)

#### 특이사항
- **Pre-update 패턴**: 프로젝트 수정 전에 이미지를 먼저 업로드
- 실제 프로젝트 ID를 entityId로 사용
- 프로젝트 등록과 동일한 토스트 패턴 (성공 시 토스트 없음)

---

## 🔧 `useImageUpload` 훅 분석

**파일**: `src/hooks/useImageUpload.ts`

### 설계 특징

```tsx
export function useImageUpload(options: UseImageUploadOptions = {}) {
  const { onError } = options

  const handleError = useCallback((message: string) => {
    if (onError) {
      onError(message)  // 커스텀 에러 핸들러 사용
    } else {
      toast.error(message)  // 기본: toast 표시
    }
  }, [onError])

  const uploadImage = async (type, entityId) => {
    try {
      // ... 업로드 로직
      return data.url  // ✅ 성공 시 URL만 리턴, 토스트 없음
    } catch (error) {
      handleError(error.message)  // ❌ 실패 시 handleError 호출
      return null
    }
  }
}
```

### 토스트 정책
- **에러**: `onError` prop이 없으면 기본적으로 `toast.error()` 호출
- **성공**: 토스트 표시 안 함 (호출하는 쪽에서 처리)

### 사용 현황
- ❌ **현재 사용처 없음** (프로젝트 등록/수정에서 사용하지 않음)
- 프로젝트 등록/수정은 `api-client.ts`의 `uploadImage` 직접 사용

---

## 📝 업계 표준 및 베스트 프랙티스

### 1. 토스트 표시 기준 (Material Design, Apple HIG 참고)

| 작업 유형 | 성공 토스트 | 실패 토스트 | 근거 |
|----------|-----------|-----------|------|
| **백그라운드 업로드** | ✅ 권장 | ✅ 필수 | 사용자가 완료 여부를 알 수 없음 |
| **즉각 반영되는 작업** | 🔶 선택적 | ✅ 필수 | UI 변경이 피드백 역할 |
| **폼 제출 포함 작업** | 🔶 선택적 | ✅ 필수 | 전체 작업 완료 시 토스트로 충분 |
| **긴 작업 (>2초)** | ✅ 필수 | ✅ 필수 | 진행 상황 피드백 필요 |

### 2. 업로드 시점 패턴

#### Pattern A: Pre-upload (프로젝트 등록/수정)
```
이미지 선택 → 제출 버튼 클릭 → 업로드 → 엔티티 생성/수정
```
**장점**: 실패 시 엔티티 생성 안 됨 (원자성)
**단점**: 제출 시간 증가 (업로드 시간 + API 시간)

#### Pattern B: Immediate upload (프로필 수정)
```
이미지 선택 → 즉시 업로드 → 폼 필드 업데이트 → 저장 버튼 클릭 → API 호출
```
**장점**: 빠른 피드백, 제출 시간 단축
**단점**: 사용자가 저장 안 하면 orphaned file 발생

### 3. 권장사항

#### 현재 SideDish 프로젝트에 적합한 접근

**케이스 1: 회원가입 프로필 설정**
- ✅ **현재 방식 유지 권장**
- 사유: 폼 내부 에러 표시가 더 명확 (토스트는 사라짐)
- 성공 피드백: 회원가입 완료 시 대시보드 이동이 충분한 피드백

**케이스 2: 프로필 수정**
- ✅ **현재 방식 유지 권장**
- 사유: 즉시 업로드 패턴이므로 업로드 완료 토스트 필수
- 개선안: 두 번째 토스트 ("프로필이 수정되었습니다") 제거 고려

**케이스 3, 4: 프로젝트 등록/수정**
- 🔶 **두 가지 옵션**

**옵션 A: 성공 토스트 추가 (권장)**
```tsx
const uploadResult = await uploadImage(selectedFile, 'project', draft.id)
imageUrl = uploadResult.url
toast.success('이미지가 업로드되었습니다.') // 추가
```
장점: 사용자에게 명확한 피드백
단점: 제출 완료 시 2번의 토스트 (업로드 + 등록/수정)

**옵션 B: 현재 방식 유지 (더 나은 선택)**
```tsx
// 성공 시 토스트 없음, 실패만 표시
// 제출 완료 시 페이지 이동이 충분한 피드백
```
장점: 토스트 과다 방지, 깔끔한 UX
단점: 업로드 완료 피드백 부족 (로딩 스피너로 보완 가능)

---

## 🎯 최종 권장사항

### 일관성 있는 토스트 정책

```tsx
// 1. 회원가입: 현재 유지 (폼 에러 표시)
// 2. 프로필 수정: 현재 유지 (즉시 업로드 토스트)
// 3, 4. 프로젝트 등록/수정: 현재 유지 (실패만 토스트)
```

### 개선 제안 (선택)

#### 1. 프로젝트 등록/수정에 로딩 표시 강화
```tsx
// 업로드 중임을 시각적으로 표시
{isUploading && (
  <div className="text-sm text-slate-600">
    이미지 업로드 중... {progress}%
  </div>
)}
```

#### 2. 프로필 수정 토스트 단순화
```tsx
// 업로드 성공 토스트 제거, 저장 완료 토스트만 유지
const handleCropComplete = async (croppedBlob) => {
  const { url } = await uploadImage(file, 'profile', user.id)
  setValue('avatarUrl', url)
  // toast.success('프로필 사진이 변경되었습니다.') // 제거
  setCropModalOpen(false)
}

// 저장 버튼 클릭 시에만 토스트
const onSubmit = async (data) => {
  await updateUser(user.id, data)
  toast.success('프로필이 수정되었습니다.') // 유지
}
```

---

## 📊 Blob 스토리지 업로드 메타데이터 저장

### Firestore `uploads` Collection 구조

```typescript
{
  id: string                    // 업로드 ID (Blob URL에서 추출)
  url: string                   // Vercel Blob URL
  userId: string                // 업로드한 사용자 ID
  type: 'profile' | 'project'   // 업로드 타입
  uploadedAt: Timestamp         // 업로드 시각
  status: 'pending'             // 초기 상태 (P1에서 'active'로 업데이트 예정)
  fileSize: number              // 파일 크기 (bytes)
  mimeType: string              // MIME 타입

  // type === 'project'일 때만 존재
  draftId?: string              // Draft ID (등록) 또는 Project ID (수정)
}
```

### entityId 사용 현황

| 케이스 | entityId 값 | 의미 | Firestore 저장 |
|--------|-------------|------|---------------|
| 회원가입 | `firebaseUser.uid` | Firebase Auth UID | ❌ draftId 필드 없음 |
| 프로필 수정 | `user.id` | Firestore User 문서 ID | ❌ draftId 필드 없음 |
| 프로젝트 등록 | `draft.id` | 클라이언트 생성 Draft ID (UUIDv7) | ✅ `draftId: draft.id` |
| 프로젝트 수정 | `id` (project ID) | 실제 프로젝트 ID | ✅ `draftId: id` |

### 주의사항

**현재 P0 구현 버그 (수정 완료)**:
```tsx
// ❌ 이전 코드 (Firestore undefined 에러)
draftId: type === 'project' ? entityId : undefined,
projectId: undefined,

// ✅ 수정된 코드
...(type === 'project' && { draftId: entityId }),
// projectId 필드는 제거 (P1에서 추가 예정)
```

---

## 🔄 P1 개선사항 (향후 작업)

### 1. Project 생성 시 Upload Metadata 업데이트

```tsx
// POST /api/projects 내부
const project = await createProject(data)

// Upload metadata 업데이트
await adminDb.collection('uploads')
  .where('draftId', '==', draftId)
  .get()
  .then(snapshot => {
    snapshot.docs.forEach(doc => {
      doc.ref.update({
        projectId: project.id,
        status: 'active'
      })
    })
  })
```

### 2. Orphaned File Cleanup (Cloud Functions)

```tsx
// Firebase Cloud Function (매일 실행)
export const cleanupOrphanedFiles = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    const sevenDaysAgo = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    )

    const orphaned = await adminDb.collection('uploads')
      .where('status', '==', 'pending')
      .where('uploadedAt', '<', sevenDaysAgo)
      .get()

    for (const doc of orphaned.docs) {
      // Vercel Blob 삭제
      await del(doc.data().url)
      // Firestore 문서 삭제
      await doc.ref.delete()
    }
  })
```

---

## 📌 결론

### 현재 구현 평가

| 항목 | 상태 | 평가 |
|------|------|------|
| **토스트 일관성** | 🟡 부분적 | 케이스별로 다름 (의도적 설계) |
| **사용자 피드백** | 🟢 양호 | 실패는 모두 표시, 성공은 선택적 |
| **업로드 시점** | 🟢 명확 | Pre-upload vs Immediate upload |
| **메타데이터 추적** | 🟢 구현됨 | P0 완료, P1 대기 중 |
| **Orphaned 파일 처리** | 🟡 보류 | P1에서 Cloud Functions 구현 예정 |

### 권장사항 요약

1. ✅ **현재 토스트 정책 유지** - 케이스별로 합리적으로 설계됨
2. 🔶 **로딩 표시 강화 고려** - 프로젝트 등록/수정 시 업로드 진행 상황 표시
3. 🔶 **프로필 수정 토스트 단순화 고려** - 중복 토스트 제거
4. ✅ **P1 개선사항 진행** - Orphaned file cleanup 구현

현재 구현은 **업계 표준과 부합**하며, 각 케이스별로 **합리적인 UX**를 제공하고 있습니다.
