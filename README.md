<div align="center">
<img width="1200" height="475" alt="SideDish Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# SideDish

**메이커들의 사이드 프로젝트를 맛있게 선보이는 AI 기반 마켓플레이스**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?logo=firebase)](https://firebase.google.com/)
[![CI](https://github.com/jhlee0409/sidedish/actions/workflows/test.yml/badge.svg)](https://github.com/jhlee0409/sidedish/actions)

[사이트 바로가기](https://sidedish.me) · [기능 소개](#features) · [시작하기](#getting-started)

</div>

---

## Overview

**SideDish**는 메이커들이 자신의 사이드 프로젝트를 공유하고 발견할 수 있는 플랫폼입니다. 요리 메타포를 활용한 독특한 컨셉과 **Gemini AI**를 통한 프로젝트 설명 자동 생성 기능이 특징입니다.

### Culinary Metaphor

| 개념 | 메타포 |
|------|--------|
| 프로젝트 | 메뉴/요리 (Dishes) |
| 메이커 | 셰프 (Chefs) |
| 사용자 | 다이너 (Diners) |
| 플랫폼 | 레스토랑 (Restaurant) |

---

## Features

### Core Features

- **프로젝트 갤러리** - 검색, 플랫폼별 필터링, 정렬, 무한 스크롤
- **AI 콘텐츠 생성** - Gemini AI로 프로젝트 설명을 자동 생성
- **소셜 로그인** - Google/GitHub OAuth 인증
- **인터랙션** - 좋아요, 리액션(🔥👏🎉💡🥰), 댓글, 귓속말(비공개 피드백)
- **마이페이지** - 내 프로젝트, 좋아요한 프로젝트, 받은 귓속말 관리

### Project Updates (개발 여정)

프로젝트의 개발 여정을 타임라인 형태로 기록하고 공유할 수 있습니다:

- **마일스톤** - 버전 출시, 주요 업데이트 기록 (🎉🚀✨🐛🔧📦🎨⚡🔒📝🌟💡)
- **개발로그** - 개발 과정, 진행 상황 공유
- **타임라인 UI** - 프로젝트 상세 페이지에서 개발 여정 확인, 펼치기/접기 지원

### Multi-Link System (멀티 플랫폼 링크)

다양한 플랫폼 링크를 프로젝트에 추가할 수 있습니다 (최대 8개, 드래그 앤 드롭 정렬):

| 카테고리 | 지원 플랫폼 |
|----------|-------------|
| 모바일 앱 | App Store, Play Store, Galaxy Store |
| 데스크탑 | Mac App Store, Windows Store, 직접 다운로드 |
| 게임 | Steam, Epic Games, itch.io, GOG |
| 확장 프로그램 | Chrome, Firefox, Edge, VS Code Marketplace |
| 패키지 | npm, PyPI |
| 일반 | Website, GitHub, Figma, Notion |

### Social Sharing (공유하기)

- **Web Share API** - 모바일에서 네이티브 공유 경험
- **소셜 플랫폼** - X(Twitter), Facebook, LinkedIn 공유
- **링크 복사** - 클립보드 복사 기능

### Contact & Support

- **문의하기 버튼** - 플로팅 버튼으로 Tally 폼 연동
- **귓속말** - 프로젝트 작성자에게 비공개 피드백 전달

### User Management

- **프로필 수정** - 닉네임, 아바타 변경
- **회원 탈퇴** - 4단계 확인 플로우, Soft Delete 방식 (법적 준수)
- **약관 동의** - 서비스 이용약관, 개인정보처리방침 (버전 관리)
- **관리자 시스템** - user/admin/master 역할 기반 권한 관리

### Security Features

- **입력 검증** - OWASP 가이드라인 준수
- **XSS 방지** - DOMPurify를 통한 콘텐츠 살균
- **Rate Limiting** - 슬라이딩 윈도우 기반 요청 제한
- **파일 검증** - Magic Number 검증으로 악성 파일 차단

### UI/UX

- **2025 UI 트렌드** - 모던하고 깔끔한 디자인
- **반응형 디자인** - 모바일 최적화 (sm, md, lg, xl 브레이크포인트)
- **Glassmorphism** - 투명도와 blur 효과 활용
- **부드러운 애니메이션** - fade-in, slide-in 등 커스텀 애니메이션

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router, Turbopack), React 19, TypeScript 5.7 |
| **Styling** | Tailwind CSS 4 |
| **Fonts** | Pretendard (본문), Gowun Batang (랜딩 헤딩) |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Auth (Google, GitHub OAuth) |
| **AI** | Google Gemini 2.5 Flash Lite |
| **Storage** | Vercel Blob |
| **Form** | React Hook Form + Zod |
| **Drag & Drop** | @dnd-kit |
| **Carousel** | Embla Carousel |
| **Security** | DOMPurify, Rate Limiter |
| **Testing** | Vitest, Testing Library |
| **CI/CD** | GitHub Actions |

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 10.25+

### Installation

```bash
# Clone the repository
git clone https://github.com/jhlee0409/sidedish.git
cd sidedish

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
pnpm dev
```

### Environment Variables

```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=

# Firebase Admin (server-side)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=

# Site Configuration (optional)
NEXT_PUBLIC_SITE_URL=https://sidedish.me
```

---

## Scripts

```bash
pnpm dev            # Start dev server (Turbopack)
pnpm build          # Production build
pnpm start          # Run production server
pnpm lint           # Run ESLint
pnpm test           # Run tests (watch mode)
pnpm test:run       # Run tests once
pnpm test:coverage  # Run tests with coverage
```

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Landing page
│   ├── dashboard/         # Project gallery (검색, 필터, 정렬)
│   ├── menu/              # Project CRUD
│   │   ├── register/      # 프로젝트 등록 (AI 생성, 멀티링크)
│   │   ├── [id]/          # 프로젝트 상세 (업데이트 타임라인 포함)
│   │   └── edit/[id]/     # 프로젝트 수정
│   ├── mypage/            # User profile
│   ├── profile/[userId]/  # Public profile
│   ├── legal/             # 법적 문서
│   │   ├── terms/         # 서비스 이용약관
│   │   ├── privacy/       # 개인정보처리방침
│   │   └── history/       # 버전 변경 이력
│   └── api/               # API routes
│
├── components/            # React components
│   ├── Dashboard.tsx      # Gallery with search/filter
│   ├── ProjectCard.tsx    # Project card
│   ├── ProjectUpdateTimeline.tsx  # 개발 여정 타임라인
│   ├── ProjectUpdateModal.tsx     # 업데이트 작성 모달
│   ├── MultiLinkInput.tsx # 멀티링크 입력 (드래그 앤 드롭)
│   ├── StoreBadges.tsx    # 스토어 뱃지 표시
│   ├── ShareSheet.tsx     # 소셜 공유 시트
│   ├── ContactButton.tsx  # 플로팅 문의 버튼
│   ├── SafeMarkdown.tsx   # XSS-safe markdown
│   └── ...
│
├── hooks/                 # Custom React hooks
│   ├── useImageUpload.ts  # 이미지 업로드
│   ├── useTagInput.ts     # 태그 입력 관리
│   ├── useAiGeneration.ts # AI 생성 with 제한
│   ├── useProjectForm.ts  # 프로젝트 폼 상태
│   └── useRequireAuth.ts  # 인증 가드
│
├── lib/                   # Utilities
│   ├── api-client.ts      # API client with caching
│   ├── security-utils.ts  # Input validation
│   ├── rate-limiter.ts    # Rate limiting
│   ├── site.ts            # 도메인/URL 중앙 관리
│   ├── seo-config.ts      # SEO 메타데이터 & JSON-LD
│   ├── share-utils.ts     # 소셜 공유 유틸
│   ├── form-constants.ts  # 폼 제약사항
│   ├── admin-constants.ts # 관리자 권한
│   ├── legal-versions.ts  # 약관 버전 관리
│   ├── schemas/           # Zod 검증 스키마
│   │   ├── common.ts      # 공통 스키마
│   │   ├── project.ts     # 프로젝트 스키마
│   │   └── user.ts        # 사용자 스키마
│   └── ...
│
├── services/              # External services
│   └── geminiService.ts   # AI integration
│
└── __tests__/             # Test files
    ├── schemas/           # 스키마 검증 테스트
    └── ...
```

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/projects` | GET/POST | 프로젝트 목록/생성 |
| `/api/projects/[id]` | GET/PATCH/DELETE | 프로젝트 상세/수정/삭제 |
| `/api/projects/[id]/like` | POST/DELETE | 좋아요 토글 |
| `/api/projects/[id]/reactions` | POST | 리액션 추가 |
| `/api/projects/[id]/comments` | GET/POST | 댓글 목록/작성 |
| `/api/projects/[id]/updates` | GET/POST | 프로젝트 업데이트 목록/작성 |
| `/api/updates/[id]` | DELETE | 프로젝트 업데이트 삭제 |
| `/api/users/[id]` | GET/PATCH | 사용자 프로필 |
| `/api/users/[id]/withdraw` | POST | 회원 탈퇴 |
| `/api/whispers` | GET/POST | 귓속말 목록/작성 |
| `/api/ai/generate` | POST | AI 콘텐츠 생성 |
| `/api/upload` | POST | 이미지 업로드 |
| `/api/stats` | GET | 플랫폼 통계 |

---

## AI Features

### Content Generation

Gemini AI가 프로젝트 설명을 자동 생성합니다:

- **한줄 소개** (80자 이내) - 호기심을 자극하는 카피
- **상세 설명** (마크다운) - 한 줄 요약, 주요 기능, 매력 포인트
- **태그 추천** (최대 5개) - 용도/장르 중심

### AI Prompting Style

- 역할: SideDish 플랫폼 에디터
- 언어: 한국어 (해요체, 위트 있게)
- 메타포: 요리/음식 은유 활용
- 금지: "최고의", "혁신적인" 같은 상투적 수식어

### Rate Limits

- 초안당 3회 생성 가능
- 일일 10회 생성 제한
- 5초 쿨다운

---

## Custom Hooks

프로젝트에서 사용하는 커스텀 훅:

```typescript
import {
  useImageUpload,
  useTagInput,
  useAiGeneration,
  useProjectForm,
  useRequireAuth,
} from '@/hooks'

// 이미지 업로드 (5MB, JPEG/PNG/WebP/GIF)
const { uploadImage, isUploading, error } = useImageUpload()

// 태그 입력 (최대 5개)
const { tags, addTag, removeTag } = useTagInput({ maxTags: 5 })

// AI 생성 with 제한
const { generate, isGenerating, limitInfo } = useAiGeneration({ draftId })
```

---

## Schema Validation

Zod를 사용한 타입 안전 폼 검증:

```typescript
import { projectFormSchema, type ProjectFormData } from '@/lib/schemas'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const { control, handleSubmit } = useForm<ProjectFormData>({
  resolver: zodResolver(projectFormSchema),
})
```

### Available Schemas

- `projectFormSchema` - 프로젝트 등록/수정 폼
- `projectUpdateFormSchema` - 마일스톤/개발로그 폼
- `signupFormSchema` - 회원가입 폼
- `profileEditFormSchema` - 프로필 수정 폼
- `withdrawalFormSchema` - 회원탈퇴 폼
- `commentFormSchema`, `whisperFormSchema` - 댓글/귓속말

---

## Security

### Input Validation

```typescript
import { validateString, validateUrl, validateTags } from '@/lib/security-utils'

// 문자열 검증
validateString(input, 'fieldName', { required: true, maxLength: 100 })

// URL 검증
validateUrl(url, 'link', { required: true })

// 태그 검증
validateTags(tags) // 최대 10개, 각 30자 이내
```

### XSS Prevention

```tsx
import SafeMarkdown from '@/components/SafeMarkdown'

// 안전한 마크다운 렌더링
<SafeMarkdown>{userContent}</SafeMarkdown>
```

### Rate Limiting

```typescript
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'

const { allowed, remaining } = checkRateLimit(key, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)
```

| Config | Limit |
|--------|-------|
| `PUBLIC_READ` | 60 req/min |
| `AUTHENTICATED_READ` | 120 req/min |
| `AUTHENTICATED_WRITE` | 30 req/min |
| `UPLOAD` | 10 req/min |
| `AI_GENERATE` | 5 req/min |

---

## Testing

```bash
# 전체 테스트 실행
pnpm test:run

# 커버리지 리포트
pnpm test:coverage

# 특정 파일 테스트
pnpm test security-utils
```

### Test Files

- `security-utils.test.ts` - 입력 검증 테스트
- `sanitize-utils.test.ts` - XSS 방지 테스트
- `rate-limiter.test.ts` - Rate Limiter 테스트
- `file-validation.test.ts` - 파일 검증 테스트
- `auth-utils.test.ts` - 인증 유틸 테스트
- `schemas/*.test.ts` - Zod 스키마 검증 테스트

---

## Database Collections

| Collection | Description |
|------------|-------------|
| `projects` | 프로젝트 정보 (links, isBeta, reactions 포함) |
| `users` | 사용자 프로필 (role, agreements, isWithdrawn 포함) |
| `comments` | 프로젝트 댓글 |
| `whispers` | 비공개 귓속말 |
| `project_updates` | 마일스톤 & 개발로그 |

---

## SEO

2025 SEO 트렌드에 맞춘 최적화:

- **메타데이터** - Open Graph, Twitter Card
- **JSON-LD** - Organization, WebSite, SoftwareApplication, FAQ 스키마
- **사이트맵** - 자동 생성
- **Canonical URL** - 중복 콘텐츠 방지

```typescript
import { getProjectSchema, getBreadcrumbSchema } from '@/lib/seo-config'

// 프로젝트 상세 페이지 JSON-LD
const schema = getProjectSchema(project)
```

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드, 설정 파일 수정
```

---

## Documentation

- [CLAUDE.md](./CLAUDE.md) - AI 어시스턴트 가이드 (상세 기술 문서)

---

## License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ by SideDish Team**

[sidedish.me](https://sidedish.me)

</div>
