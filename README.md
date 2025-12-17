<div align="center">
<img width="1200" height="475" alt="SideDish Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# SideDish

**메이커들의 사이드 프로젝트를 맛있게 선보이는 AI 기반 마켓플레이스**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-12.6-FFCA28?logo=firebase)](https://firebase.google.com/)

[데모 보기](https://ai.studio/apps/drive/17aNYjI3qHlrwaavdFK-YjUkY37LZro9V) · [기능 소개](#features) · [시작하기](#getting-started)

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

- **프로젝트 갤러리** - 검색, 필터링, 무한 스크롤 지원
- **AI 콘텐츠 생성** - Gemini AI로 프로젝트 설명을 자동 생성
- **소셜 로그인** - Google/GitHub OAuth 인증
- **인터랙션** - 좋아요, 리액션(🔥👏🎉💡🥰), 댓글, 귓속말
- **마이페이지** - 내 프로젝트, 좋아요한 프로젝트, 받은 귓속말 관리

### Security Features

- **입력 검증** - OWASP 가이드라인 준수
- **XSS 방지** - DOMPurify를 통한 콘텐츠 살균
- **Rate Limiting** - 슬라이딩 윈도우 기반 요청 제한
- **파일 검증** - Magic Number 검증으로 악성 파일 차단

### User Management

- **프로필 수정** - 닉네임, 아바타 변경
- **회원 탈퇴** - 4단계 확인 플로우, Soft Delete 방식
- **약관 동의** - 서비스 이용약관, 개인정보처리방침

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript 5.7 |
| **Styling** | Tailwind CSS 4 |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Auth (Google, GitHub OAuth) |
| **AI** | Google Gemini 2.5 Flash Lite |
| **Storage** | Vercel Blob |
| **Form** | React Hook Form + Zod |
| **Security** | DOMPurify, Rate Limiter |
| **Testing** | Vitest, Testing Library |

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
│   ├── dashboard/         # Project gallery
│   ├── menu/              # Project CRUD
│   ├── mypage/            # User profile
│   ├── profile/[userId]/  # Public profile
│   └── api/               # API routes
│
├── components/            # React components
│   ├── Dashboard.tsx      # Gallery with search/filter
│   ├── ProjectCard.tsx    # Project card
│   ├── SafeMarkdown.tsx   # XSS-safe markdown
│   └── ...
│
├── lib/                   # Utilities
│   ├── api-client.ts      # API client with caching
│   ├── security-utils.ts  # Input validation
│   ├── rate-limiter.ts    # Rate limiting
│   └── ...
│
├── services/              # External services
│   └── geminiService.ts   # AI integration
│
└── __tests__/             # Test files
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
| `/api/users/[id]` | GET/PATCH | 사용자 프로필 |
| `/api/users/[id]/withdraw` | POST | 회원 탈퇴 |
| `/api/whispers` | GET/POST | 귓속말 목록/작성 |
| `/api/ai/generate` | POST | AI 콘텐츠 생성 |
| `/api/upload` | POST | 이미지 업로드 |

---

## AI Features

### Content Generation

Gemini AI가 프로젝트 설명을 자동 생성합니다:

- **한줄 소개** (80자 이내)
- **상세 설명** (마크다운 형식)
- **태그 추천** (최대 5개)

### Rate Limits

- 초안당 3회 생성 가능
- 일일 10회 생성 제한
- 5초 쿨다운

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

- [CLAUDE.md](./CLAUDE.md) - AI 어시스턴트 가이드
- [SKILLS.md](./SKILLS.md) - 개발 스킬 가이드

---

## License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ by SideDish Team**

</div>
