# 도시락 시스템 설계 계획 🍱

## 개요

SideDish에 **도시락 구독 시스템**을 추가합니다.
- 관리자가 다이제스트 생성 (날씨, 뉴스, 코인 등)
- 사용자가 원하는 도시락 구독
- 매일 정해진 시간에 이메일로 도시락 배달

### 용어 정리

| UI (한글) | API/코드 (영문) | 설명 |
|-----------|----------------|------|
| 도시락 | **Digest** | 매일 배달되는 정보 꾸러미 |
| 도시락 신청 | **Subscription** | 구독하기 |
| 도시락 배달 | **Delivery** | 이메일 발송 |
| 오늘의 도시락 | **Daily Digest** | AI가 만든 브리핑 |

---

## 1. 데이터베이스 스키마

### 1.1 Firestore Collections

```
digests/                    # 다이제스트 정의
  {digestId}/
    - id: string
    - name: string          # "오늘의 날씨 도시락" (UI용)
    - slug: string          # "weather" (URL용)
    - description: string   # 다이제스트 설명
    - icon: string          # 이모지 "☀️"
    - category: string      # "weather" | "finance" | "news" | ...
    - isActive: boolean     # 활성화 여부
    - isPremium: boolean    # 유료 여부
    - config: object        # 다이제스트별 설정
      - cities?: string[]   # 날씨: 지원 도시 목록
      - deliveryTime: string # "07:00" 배달 시간 (KST)
    - createdAt: Timestamp
    - updatedAt: Timestamp

digest_subscriptions/       # 구독 정보
  {subscriptionId}/
    - id: string
    - userId: string        # 구독한 사용자
    - userEmail: string     # 이메일 발송용
    - digestId: string      # 구독한 다이제스트
    - settings: object      # 사용자별 설정
      - city?: string       # 날씨: 선택한 도시
      - detailMode?: boolean # 상세 모드 여부 (기본 false)
    - isActive: boolean     # 구독 활성 상태
    - createdAt: Timestamp
    - updatedAt: Timestamp

digest_logs/                # 배달 로그 (디버깅/통계용)
  {logId}/
    - id: string
    - digestId: string
    - deliveredAt: Timestamp
    - subscriberCount: number
    - successCount: number
    - failureCount: number
    - generatedContent: object  # AI 생성 결과 (캐시)
```

### 1.2 TypeScript 타입 정의

```typescript
// src/lib/digest-types.ts

import { Timestamp } from 'firebase-admin/firestore'

// 다이제스트 카테고리
export type DigestCategory = 'weather' | 'finance' | 'news' | 'lifestyle' | 'other'

// 지원 도시
export type SupportedCity = 'seoul' | 'busan' | 'daegu' | 'incheon' | 'daejeon' | 'gwangju'

export const CITY_NAMES: Record<SupportedCity, string> = {
  seoul: '서울',
  busan: '부산',
  daegu: '대구',
  incheon: '인천',
  daejeon: '대전',
  gwangju: '광주',
}

// Firestore 문서 타입
export interface DigestDoc {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: DigestCategory
  isActive: boolean
  isPremium: boolean
  config: {
    cities?: SupportedCity[]
    deliveryTime: string  // "HH:mm" KST
  }
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DigestSubscriptionDoc {
  id: string
  userId: string
  userEmail: string
  digestId: string
  settings: {
    city?: SupportedCity
    detailMode?: boolean
  }
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface DigestLogDoc {
  id: string
  digestId: string
  deliveredAt: Timestamp
  subscriberCount: number
  successCount: number
  failureCount: number
  generatedContent: Record<string, DigestContent>
}

export interface DigestContent {
  summary: string   // 한 줄 요약 (이메일용)
  content: string   // 상세 내용 (마크다운)
}

// API 응답 타입
export interface DigestResponse {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  category: DigestCategory
  isActive: boolean
  isPremium: boolean
  config: {
    cities?: SupportedCity[]
    deliveryTime: string
  }
  subscriberCount?: number
  isSubscribed?: boolean
  createdAt: string
  updatedAt: string
}

export interface DigestSubscriptionResponse {
  id: string
  digest: DigestResponse
  settings: {
    city?: SupportedCity
    detailMode?: boolean
  }
  isActive: boolean
  createdAt: string
}
```

---

## 2. API 엔드포인트

### 2.1 다이제스트 관련

| Endpoint | Method | Auth | 설명 |
|----------|--------|------|------|
| `/api/digests` | GET | No | 활성 다이제스트 목록 |
| `/api/digests` | POST | Admin | 다이제스트 생성 |
| `/api/digests/[id]` | GET | No | 다이제스트 상세 |
| `/api/digests/[id]` | PATCH | Admin | 다이제스트 수정 |
| `/api/digests/[id]` | DELETE | Admin | 다이제스트 삭제 |
| `/api/digests/[id]/preview` | GET | No | 오늘의 다이제스트 미리보기 |

### 2.2 구독 관련

| Endpoint | Method | Auth | 설명 |
|----------|--------|------|------|
| `/api/digests/subscriptions` | GET | Yes | 내 구독 목록 |
| `/api/digests/subscriptions` | POST | Yes | 다이제스트 구독 |
| `/api/digests/subscriptions/[id]` | PATCH | Yes | 구독 설정 수정 |
| `/api/digests/subscriptions/[id]` | DELETE | Yes | 구독 해제 |

### 2.3 배달 관련 (Cron)

| Endpoint | Method | Auth | 설명 |
|----------|--------|------|------|
| `/api/cron/digests/[slug]` | GET | Cron Secret | 다이제스트 배달 실행 |

---

## 3. 페이지 구조

### 3.1 라우트 (URL은 브랜딩 용어 사용)

```
src/app/
├── lunchbox/                     # UI: "도시락"
│   ├── page.tsx                  # 도시락 목록
│   └── [slug]/
│       └── page.tsx              # 도시락 상세 + 미리보기
└── mypage/
    └── page.tsx                  # 기존 + "도시락 구독" 탭
```

### 3.2 도시락 목록 페이지 (`/lunchbox`)

```
┌─────────────────────────────────────────────────────────┐
│  🍱 오늘의 도시락                                       │
│  매일 아침, 당신에게 필요한 정보를 배달해드려요         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ ☀️ 날씨     │  │ 📈 코인     │  │ 📰 IT뉴스   │     │
│  │ 도시락      │  │ 도시락      │  │ 도시락      │     │
│  │             │  │             │  │             │     │
│  │ 매일 7시    │  │ 매일 8시    │  │ 매일 9시    │     │
│  │ 배달        │  │ 배달        │  │ 배달        │     │
│  │             │  │             │  │             │     │
│  │ [신청하기]  │  │ [신청하기]  │  │ [신청중 ✓]  │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.3 도시락 상세 페이지 (`/lunchbox/weather`)

```
┌─────────────────────────────────────────────────────────┐
│  ☀️ 날씨 도시락                                         │
│  어제와 비교한 오늘의 날씨, AI가 분석해드려요           │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📍 도시 선택                                           │
│  ┌────────┐ ┌────────┐ ┌────────┐                      │
│  │ 서울 ✓ │ │ 부산   │ │ 대구   │  ...                 │
│  └────────┘ └────────┘ └────────┘                      │
│                                                         │
│  ⏰ 배달 시간: 매일 오전 7시                            │
│                                                         │
│  [도시락 신청하기]                                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  🍱 오늘의 도시락 미리보기                              │
│                                                         │
│  어제보다 3도 떨어진 영하 1도로 시작하는 아침이에요.   │
│  체감온도는 영하 5도까지 내려가니 두꺼운 패딩은 필수!  │
│  ...                                                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3.4 마이페이지 도시락 구독 탭

```
┌─────────────────────────────────────────────────────────┐
│  [내 메뉴] [찜한 메뉴] [받은 귓속말] [도시락 구독]      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  신청 중인 도시락 (2/5)                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☀️ 날씨 도시락                                   │   │
│  │ 📍 서울 · ⏰ 매일 7시 배달                       │   │
│  │                                    [설정] [해제] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📰 IT뉴스 도시락                                 │   │
│  │ ⏰ 매일 9시 배달                                 │   │
│  │                                    [설정] [해제] │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [+ 더 많은 도시락 보기]                                │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. 날씨 다이제스트 상세 설계

### 4.1 데이터 흐름

```
[Cron Job - 매일 6:50 KST]
        │
        ▼
[1. 날씨 API 호출]
   OpenWeatherMap API
   - 주요 도시별 현재 날씨
   - 어제 날씨 (캐시)
   - 오늘 예보
        │
        ▼
[2. 데이터 통합]
   {
     seoul: { yesterday: {...}, today: {...}, forecast: {...} },
     busan: { ... },
     ...
   }
        │
        ▼
[3. AI 분석 - 1회 호출]
   Gemini 2.5 Flash Lite
   - 모든 도시 데이터 입력
   - 도시별 종합 브리핑 생성
        │
        ▼
[4. 결과 캐시 저장]
   digest_logs에 저장
   (같은 날 재요청 시 캐시 사용)
        │
        ▼
[5. 이메일 배달 - 7:00 KST]
   구독자별로 선택한 도시의 도시락 배달
```

### 4.2 AI 프롬프트

```typescript
const WEATHER_DIGEST_PROMPT = `
당신은 SideDish 플랫폼의 날씨 도시락 담당 셰프입니다.

## 입력 데이터
다음은 주요 도시의 어제와 오늘 날씨 데이터입니다:
${JSON.stringify(weatherData, null, 2)}

## 출력 형식
각 도시별로 다음 JSON 형식으로 도시락 내용을 작성해주세요:

{
  "seoul": {
    "summary": "한 줄 요약 (이메일용, 50자 이내)",
    "content": "종합 브리핑 (마크다운, 200자 내외)"
  },
  "busan": { ... },
  ...
}

## 도시락 작성 가이드
1. 어제 대비 오늘 기온 변화 언급
2. 옷차림 추천 (구체적으로)
3. 우산 필요 여부
4. 미세먼지/자외선 주의사항 (해당 시)
5. 마무리 한마디 (따뜻한 톤)

톤앤매너: 친근하고 따뜻하게, 해요체 사용
금지: 상투적 표현, 과도한 이모지
`;
```

### 4.3 이메일 템플릿

```html
<!-- 요약 모드 (기본) -->
<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #4F46E5;">🍱 오늘의 도시락이 도착했어요!</h1>
  <p style="color: #64748B;">2024년 12월 19일 목요일</p>

  <div style="background: #F8FAFC; padding: 20px; border-radius: 12px; margin: 20px 0;">
    <h2>☀️ 서울 날씨</h2>
    <p style="font-size: 18px; color: #1E293B;">
      어제보다 3도 ↓, 두꺼운 패딩 필수
    </p>
  </div>

  <a href="https://sidedish.me/lunchbox/weather"
     style="display: inline-block; background: #4F46E5; color: white;
            padding: 12px 24px; border-radius: 8px; text-decoration: none;">
    👉 자세히 보기
  </a>

  <hr style="margin: 30px 0; border: none; border-top: 1px solid #E2E8F0;">

  <p style="color: #94A3B8; font-size: 12px;">
    이 메일은 SideDish 도시락 구독으로 배달되었습니다.<br>
    <a href="https://sidedish.me/mypage">구독 관리</a>
  </p>
</div>
```

---

## 5. 이메일 발송 시스템

### 5.1 Resend 설정

```typescript
// src/lib/resend.ts
import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDigestEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  return resend.emails.send({
    from: 'SideDish <noreply@sidedish.me>',
    to,
    subject,
    html,
  })
}
```

### 5.2 환경 변수 추가

```bash
# .env.local
RESEND_API_KEY=re_xxxxx

# 날씨 API
OPENWEATHERMAP_API_KEY=xxxxx

# Cron 시크릿 (보안용)
CRON_SECRET=xxxxx
```

---

## 6. 스케줄링

### 6.1 Vercel Cron Jobs

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/digests/weather",
      "schedule": "50 21 * * *"  // UTC 21:50 = KST 06:50
    }
  ]
}
```

### 6.2 Cron 엔드포인트

```typescript
// src/app/api/cron/digests/weather/route.ts

export async function GET(request: Request) {
  // 1. Cron 시크릿 검증
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 })
  }

  // 2. 날씨 데이터 수집
  const weatherData = await fetchWeatherData()

  // 3. AI 다이제스트 생성
  const digestContent = await generateWeatherDigest(weatherData)

  // 4. 구독자에게 배달
  const subscribers = await getDigestSubscribers('weather')
  await deliverDigest(subscribers, digestContent)

  // 5. 로그 저장
  await saveDigestLog('weather', { ... })

  return Response.json({ success: true })
}
```

---

## 7. 구현 순서 (MVP)

### Phase 1: 기반 구조
- [ ] 타입 정의 (`src/lib/digest-types.ts`)
- [ ] Firestore 컬렉션 상수 추가
- [ ] 다이제스트 API 엔드포인트 (CRUD)
- [ ] 구독 API 엔드포인트

### Phase 2: UI 구현
- [ ] 도시락 목록 페이지 (`/lunchbox`)
- [ ] 도시락 카드 컴포넌트
- [ ] 구독 버튼/모달
- [ ] 마이페이지 도시락 구독 탭

### Phase 3: 날씨 다이제스트
- [ ] OpenWeatherMap API 연동
- [ ] AI 다이제스트 생성 서비스
- [ ] 미리보기 API
- [ ] 도시락 상세 페이지

### Phase 4: 이메일 발송
- [ ] Resend 설정
- [ ] 이메일 템플릿 컴포넌트
- [ ] 배달 로직 구현
- [ ] Vercel Cron 설정

### Phase 5: 테스트 & 마무리
- [ ] E2E 테스트 (구독 → 배달)
- [ ] 에러 핸들링 보강
- [ ] 로깅/모니터링
- [ ] 문서화

---

## 8. 파일 구조 (최종)

```
src/
├── app/
│   ├── lunchbox/                       # UI 라우트 (도시락)
│   │   ├── page.tsx                    # 도시락 목록
│   │   └── [slug]/
│   │       └── page.tsx                # 도시락 상세
│   ├── api/
│   │   ├── digests/                    # API (다이제스트)
│   │   │   ├── route.ts                # GET (목록), POST (생성)
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts            # GET, PATCH, DELETE
│   │   │   │   └── preview/route.ts    # GET (미리보기)
│   │   │   └── subscriptions/
│   │   │       ├── route.ts            # GET (내 구독), POST (신청)
│   │   │       └── [id]/route.ts       # PATCH, DELETE
│   │   └── cron/
│   │       └── digests/
│   │           └── weather/route.ts    # Cron 배달
│   └── mypage/page.tsx                 # 도시락 구독 탭 추가
│
├── components/
│   ├── lunchbox/                       # UI 컴포넌트 (도시락)
│   │   ├── LunchboxCard.tsx            # 도시락 카드
│   │   ├── LunchboxSubscribeModal.tsx  # 구독 설정 모달
│   │   ├── SubscriptionCard.tsx        # 구독 카드 (마이페이지용)
│   │   └── WeatherPreview.tsx          # 날씨 미리보기
│   └── emails/
│       └── DigestEmail.tsx             # 이메일 템플릿
│
├── lib/
│   ├── digest-types.ts                 # 다이제스트 타입 정의
│   ├── resend.ts                       # Resend 클라이언트
│   └── api-client.ts                   # 다이제스트 API 함수 추가
│
└── services/
    ├── weatherService.ts               # OpenWeatherMap API
    └── digestService.ts                # AI 다이제스트 생성
```

---

## 9. 보안 고려사항

1. **Cron 엔드포인트**: `CRON_SECRET` 헤더 검증
2. **Admin 전용 API**: Firebase Custom Claims로 관리자 권한 체크
3. **구독 제한**: 사용자당 최대 5개
4. **Rate Limiting**: 구독/해제 API에 적용
5. **이메일 검증**: Firebase Auth 이메일 사용

---

## 10. 확장 계획

### 향후 추가 다이제스트
- 📈 코인/주식 다이제스트
- 📰 IT 뉴스 다이제스트
- 💱 환율 다이제스트
- 📅 일정 리마인더 다이제스트

### 확장 기능
- 사용자 다이제스트 레시피 생성 (Phase 2)
- 다이제스트 마켓플레이스
- 유료 다이제스트 결제 연동
- 푸시 알림 옵션

---

## 11. 용어 매핑 가이드

### UI ↔ 코드 매핑

| UI 텍스트 | 코드/API | 파일명 |
|-----------|----------|--------|
| 도시락 | Digest | `digest-types.ts` |
| 도시락 목록 | Digests | `/api/digests` |
| 도시락 신청 | Subscribe | `subscriptions` |
| 도시락 구독 | Subscription | `DigestSubscription` |
| 배달 시간 | deliveryTime | `config.deliveryTime` |
| 도시락 배달 | Delivery | `deliverDigest()` |

### UI 텍스트 상수

```typescript
// src/lib/lunchbox-text.ts
export const LUNCHBOX_TEXT = {
  // 페이지
  LIST_TITLE: '🍱 오늘의 도시락',
  LIST_DESCRIPTION: '매일 아침, 당신에게 필요한 정보를 배달해드려요',

  // 버튼
  SUBSCRIBE: '도시락 신청하기',
  SUBSCRIBED: '신청 중',
  UNSUBSCRIBE: '구독 해제',

  // 마이페이지
  TAB_TITLE: '도시락 구독',
  SUBSCRIPTION_COUNT: (current: number, max: number) =>
    `신청 중인 도시락 (${current}/${max})`,
  EMPTY_STATE: '아직 신청한 도시락이 없어요',
  VIEW_MORE: '+ 더 많은 도시락 보기',

  // 이메일
  EMAIL_SUBJECT: '🍱 오늘의 도시락이 도착했어요!',
  EMAIL_FOOTER: '이 메일은 SideDish 도시락 구독으로 배달되었습니다.',

  // 시간
  DELIVERY_TIME: (time: string) => `매일 오전 ${time} 배달`,
} as const
```

---

이 계획으로 구현을 시작합니다!
