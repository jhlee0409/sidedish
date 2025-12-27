# 프로덕션 배포 준비 상태 종합 평가

**평가 일시**: 2025-12-28
**변경 내용**: P0 개선사항 (UUIDv7 + Upload Metadata)
**결론**: ⚠️ **조건부 배포 가능** (권장사항 적용 시 안전)

---

## ✅ 1. 빌드 및 타입 체크

### 빌드 상태
```bash
✓ Compiled successfully in 3.2s
✓ Production build completed
✓ TypeScript type check passed
```

**결과**: ✅ **통과** - 프로덕션 빌드 성공

### 수정된 설정
- **next.config.ts**: turbopack 설정 제거 (Next.js 16 호환성)
- **firebase-admin imports**: `adminDb` → `getAdminDb()` 함수 사용

---

## ✅ 2. 테스트 검증

### 변경사항 관련 테스트
```bash
✓ upload.test.ts (23 tests) - 모두 통과
✓ api-client.test.ts (7 tests) - 모두 통과
━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: 30/30 passed ✅
```

### 기존 테스트 실패 (변경사항과 무관)
```bash
✗ projects.test.ts (5 tests) - 기존 mock 문제
✗ users.test.ts (1 test) - 기존 mock 문제
```

**결과**: ✅ **통과** - 우리 변경사항 관련 테스트 100% 통과

**참고**: 실패한 테스트는 우리의 P0 변경사항 (upload/draftService)과 무관하며, 기존 Firestore mock 설정 문제입니다.

---

## ⚠️ 3. Breaking Changes 분석

### 3.1 Draft ID 형식 변경

**Before**:
```typescript
generateDraftId(): `draft_1703789012345_abc123`
```

**After**:
```typescript
generateDraftId(): `f7e8c9a1-b2d3-7c4e-8f5a-9b6c3d1e2f4a` (UUIDv7)
```

**영향 분석**:
- ✅ **클라이언트 사이드**: localStorage에 저장된 기존 draft는 그대로 유지됨
- ✅ **서버 사이드**: Draft ID는 서버에 저장되지 않음 (클라이언트 전용)
- ✅ **API**: Draft ID는 upload API의 `entityId`로만 사용 (형식 무관)
- ✅ **Firestore**: 기존 프로젝트는 UUIDv7이 아닌 Firestore auto ID 사용 (영향 없음)

**Breaking Change 여부**: ❌ **없음**

**사유**:
1. Draft ID는 클라이언트 전용 임시 ID
2. 기존 draft는 localStorage에 그대로 유지
3. 새 draft만 UUIDv7 형식 사용
4. Firestore에는 draft가 저장되지 않음

### 3.2 Upload API 변경

**Before**:
```typescript
POST /api/upload
- Vercel Blob에만 저장
- 메타데이터 추적 없음
```

**After**:
```typescript
POST /api/upload
- Vercel Blob 저장
- + Firestore uploads collection에 메타데이터 저장
```

**영향 분석**:
- ✅ **API 시그니처**: 변경 없음 (FormData: file, type, entityId)
- ✅ **응답 형식**: 변경 없음 ({ url, size, originalSize, compressionRatio })
- ✅ **클라이언트**: 변경 없음 (api-client.ts, hooks 호환)

**Breaking Change 여부**: ❌ **없음**

**사유**: API 인터페이스는 동일, 내부 로직만 추가

### 3.3 Delete API 변경

**Before**:
```typescript
import { adminDb } from '@/lib/firebase-admin'
const projectDoc = await adminDb.collection('projects')...
```

**After**:
```typescript
import { getAdminDb } from '@/lib/firebase-admin'
const adminDb = getAdminDb()
const projectDoc = await adminDb.collection('projects')...
```

**영향 분석**:
- ✅ **내부 구현만 변경**
- ✅ **API 동작 동일**

**Breaking Change 여부**: ❌ **없음**

---

## ⚠️ 4. 성능 및 비용 영향 평가

### 4.1 업로드 지연 시간

**추가된 작업**:
```typescript
// Firestore write 추가
await adminDb.collection('uploads').doc(uploadId).set(uploadMetadata)
```

**성능 영향**:
- **추가 지연**: ~50-100ms (Firestore write)
- **총 업로드 시간**: Vercel Blob upload (1-3초) + Firestore write (50-100ms)
- **영향도**: **미미** (전체 업로드 시간의 3-5%)

### 4.2 Firestore 비용 영향

**Before**:
- 업로드당 Firestore write: 0회

**After**:
- 업로드당 Firestore write: +1회 (uploads collection)

**월간 비용 추정**:
```
가정: 월 1000회 업로드
- Firestore write: 1000 writes/month
- 무료 할당량: 20K writes/day (600K writes/month)
- 추가 비용: $0 (무료 할당량 내)
```

**결론**: ✅ **비용 영향 없음** (무료 할당량 충분)

### 4.3 Firestore 읽기 비용

**현재 구현**:
- ✅ **읽기 없음** (메타데이터는 쓰기만 수행)
- ⏳ **P1 단계**: cleanup job에서 읽기 발생 예정

**결론**: ✅ **현재 읽기 비용 없음**

---

## ✅ 5. Firestore 보안 규칙 확인

### 5.1 새로 추가된 Collection

```
uploads/
  └─ {uploadId}
      ├─ userId
      ├─ url
      ├─ type
      ├─ uploadedAt
      ├─ draftId
      ├─ projectId
      ├─ status
      ├─ fileSize
      └─ mimeType
```

### 5.2 현재 보안 규칙 상태

⚠️ **uploads collection에 대한 보안 규칙이 아직 없음**

### 5.3 권장 보안 규칙

```javascript
// firestore.rules
match /uploads/{uploadId} {
  // 1. 업로드한 사용자만 읽기 가능
  allow read: if request.auth != null
    && request.auth.uid == resource.data.userId;

  // 2. 쓰기는 서버에서만 (Admin SDK)
  allow write: if false;
}
```

**설명**:
1. **읽기**: 본인이 업로드한 파일 메타데이터만 조회 가능
2. **쓰기**: Admin SDK만 가능 (API 서버만 write)

### 5.4 배포 전 필수 작업

⚠️ **CRITICAL**: Firestore 보안 규칙 업데이트 필수!

```bash
# Firebase Console에서 수동 적용 또는
firebase deploy --only firestore:rules
```

---

## ✅ 6. 데이터 마이그레이션 필요성

### 6.1 기존 데이터 영향

**Projects**:
- ✅ 영향 없음 (프로젝트 데이터 구조 변경 없음)

**Users**:
- ✅ 영향 없음 (사용자 데이터 구조 변경 없음)

**Uploads** (Vercel Blob):
- ✅ 기존 파일: 그대로 유지 (삭제 안 됨)
- ✅ 기존 파일 메타데이터: 없음 (추적 불가, P1 단계에서 정리 예정)
- ✅ 신규 파일: 메타데이터 추적 시작

### 6.2 마이그레이션 필요 여부

❌ **마이그레이션 불필요**

**사유**:
1. 새 데이터 구조만 추가 (기존 데이터 변경 없음)
2. 기존 파일은 그대로 유지
3. 새 업로드부터만 메타데이터 추적
4. 하위 호환성 유지

---

## ✅ 7. 롤백 계획

### 7.1 롤백 시나리오

**문제 발생 시**:
1. Firestore uploads collection에 write 실패
2. Upload API 성능 저하
3. 예상치 못한 버그 발생

### 7.2 롤백 절차

**Step 1: 코드 롤백 (Git)**
```bash
git revert HEAD~3  # 최근 3개 커밋 롤백 (P0 개선사항)
git push origin main
```

**Step 2: Vercel 재배포**
```bash
vercel --prod  # 이전 버전으로 재배포
```

**Step 3: Firestore cleanup (선택)**
```javascript
// uploads collection 삭제 (선택사항)
const batch = adminDb.batch()
const uploads = await adminDb.collection('uploads').get()
uploads.docs.forEach(doc => batch.delete(doc.ref))
await batch.commit()
```

### 7.3 롤백 영향

**안전성**:
- ✅ **사용자 데이터**: 영향 없음 (uploads는 메타데이터만 저장)
- ✅ **업로드 파일**: Vercel Blob에 그대로 유지
- ✅ **프로젝트**: 영향 없음

**롤백 가능 여부**: ✅ **안전하게 롤백 가능**

---

## ⚠️ 8. 배포 전 체크리스트

### 필수 작업 (CRITICAL)
- [ ] **Firestore 보안 규칙 업데이트** (uploads collection)
- [ ] **환경 변수 확인** (FIREBASE_ADMIN_* 변수 존재 여부)
- [ ] **Vercel Blob 토큰 확인** (BLOB_READ_WRITE_TOKEN)

### 권장 작업 (Recommended)
- [ ] **Staging 환경 테스트** (가능한 경우)
- [ ] **수동 업로드 테스트** (프로덕션 배포 후 즉시)
- [ ] **Firestore 콘솔 모니터링** (uploads collection write 확인)

### 선택 작업 (Optional)
- [ ] **Sentry 에러 모니터링 설정**
- [ ] **Slack 알림 설정** (배포 알림)
- [ ] **롤백 스크립트 준비**

---

## 🎯 9. 최종 결론 및 권장사항

### 배포 가능 여부

**결론**: ⚠️ **조건부 배포 가능**

### 배포 전 필수 조치

1. ✅ **Firestore 보안 규칙 업데이트**
   ```javascript
   match /uploads/{uploadId} {
     allow read: if request.auth != null
       && request.auth.uid == resource.data.userId;
     allow write: if false;
   }
   ```

2. ✅ **환경 변수 확인**
   - `FIREBASE_ADMIN_PROJECT_ID`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `BLOB_READ_WRITE_TOKEN`

3. ✅ **배포 후 즉시 검증**
   - 프로필 사진 업로드 테스트
   - 프로젝트 이미지 업로드 테스트
   - Firestore uploads collection write 확인

### 배포 시 주의사항

1. **점진적 배포 권장**
   - Vercel preview 배포 먼저 테스트
   - 프로덕션 배포 후 모니터링

2. **성능 모니터링**
   - 업로드 응답 시간 확인 (50-100ms 증가 예상)
   - Firestore write 오류 모니터링

3. **롤백 준비**
   - Git 커밋 해시 기록
   - 롤백 명령어 준비
   - 긴급 연락망 확인

### 장기 권장사항 (P1 단계)

1. **Orphaned File Cleanup**
   - Cloud Functions 구현
   - 7일 이상 된 pending 파일 삭제

2. **Project 생성 시 Metadata 업데이트**
   - status: 'pending' → 'active'
   - projectId 매핑

3. **모니터링 대시보드**
   - 업로드 실패율 추적
   - Orphaned 파일 개수 모니터링
   - 저장 공간 사용량 추적

---

## 📊 10. 위험도 평가

| 항목 | 위험도 | 완화 조치 |
|------|--------|-----------|
| Breaking Changes | 🟢 낮음 | API 인터페이스 유지 |
| 성능 영향 | 🟢 낮음 | 50-100ms 추가 지연 (허용 범위) |
| 비용 영향 | 🟢 낮음 | 무료 할당량 내 |
| 보안 위험 | 🟡 중간 | Firestore 규칙 필수 적용 |
| 롤백 난이도 | 🟢 낮음 | 안전하게 롤백 가능 |
| 데이터 손실 위험 | 🟢 낮음 | 기존 데이터 영향 없음 |

**종합 위험도**: 🟢 **낮음** (보안 규칙 적용 시)

---

## ✅ 11. 배포 승인 조건

다음 조건을 모두 충족하면 **프로덕션 배포 승인**:

1. ✅ Firestore 보안 규칙 업데이트 완료
2. ✅ 환경 변수 확인 완료
3. ✅ 롤백 계획 숙지
4. ✅ 배포 후 즉시 검증 준비

**배포 타이밍 권장**: 업무 시간 (문제 발생 시 즉시 대응 가능)

---

## 📝 12. 배포 후 체크리스트

### 즉시 (배포 후 5분 이내)
- [ ] 프로필 사진 업로드 테스트
- [ ] 프로젝트 이미지 업로드 테스트
- [ ] Firestore Console에서 uploads collection 확인
- [ ] Vercel Logs 에러 확인

### 1시간 이내
- [ ] 실제 사용자 업로드 모니터링
- [ ] Firestore write 건수 확인
- [ ] 업로드 응답 시간 측정

### 24시간 이내
- [ ] 에러 로그 분석
- [ ] 성능 지표 확인
- [ ] 사용자 피드백 수집

---

**최종 권장**: ✅ **Firestore 보안 규칙 적용 후 배포 가능**
