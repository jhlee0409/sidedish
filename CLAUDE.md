# CLAUDE.md - AI Assistant Guide for SideDish

## Project Overview

**SideDish** is an AI-powered marketplace platform where developers showcase their side projects. It uses a culinary metaphor throughout:
- Projects = "메뉴" (Dishes)
- Developers = "셰프" (Chefs)
- Users = "다이너" (Diners)
- Platform = "레스토랑" (Restaurant)

The standout feature is **Gemini AI integration** that transforms basic project descriptions into polished, engaging "menu descriptions" in Korean.

## Tech Stack

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Next.js (App Router) | 16.0.10 |
| UI Library | React | 19.0.0 |
| Language | TypeScript | 5.7.2 (strict mode) |
| Styling | Tailwind CSS | 4.0.0 |
| Database | Firebase Firestore | 12.6.0 |
| Auth | Firebase Auth (Google, GitHub OAuth) | 12.6.0 |
| Backend | Firebase Admin SDK | 13.6.0 |
| AI | Google Generative AI (Gemini 2.5 Flash Lite) | 1.0.0 |
| Storage | Vercel Blob | 2.0.0 |
| Markdown | React Markdown | 10.1.0 |
| XSS Protection | DOMPurify | 3.3.1 |
| Form Validation | React Hook Form + Zod | 7.68.0 / 4.2.1 |
| Icons | Lucide React | 0.468.0 |
| Notifications | Sonner | 2.0.7 |
| Drag & Drop | @dnd-kit | 6.3.1 |
| Carousel | Embla Carousel | 8.6.0 |
| Testing | Vitest + Testing Library | 4.0.16 |
| Package Manager | pnpm | 10.25.0 |
| Dev Server | Turbopack | (built-in) |

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Root - Landing page
│   ├── layout.tsx                 # Root layout with AuthProvider & SEO
│   ├── globals.css                # Global styles & Tailwind 4 config
│   ├── dashboard/page.tsx         # Project gallery with search/filter
│   ├── menu/
│   │   ├── register/page.tsx      # Project submission form
│   │   ├── [id]/page.tsx          # Project detail view
│   │   └── edit/[id]/page.tsx     # Project edit form
│   ├── login/page.tsx             # Firebase login
│   ├── profile/[userId]/page.tsx  # Public profile page
│   ├── mypage/page.tsx            # User profile & liked projects
│   ├── legal/                     # Legal pages
│   │   ├── terms/page.tsx         # Terms of service
│   │   ├── privacy/page.tsx       # Privacy policy
│   │   └── history/page.tsx       # Version history
│   ├── lunchbox/                  # @deprecated Digest feature
│   │   ├── page.tsx               # Digest list
│   │   ├── [slug]/page.tsx        # Digest detail
│   │   └── create/page.tsx        # Admin: create digest
│   └── api/                       # REST API endpoints
│       ├── projects/              # Project CRUD
│       │   ├── route.ts           # GET (list), POST (create)
│       │   └── [id]/
│       │       ├── route.ts       # GET, PATCH, DELETE
│       │       ├── like/route.ts  # Like/unlike
│       │       ├── reactions/route.ts
│       │       ├── comments/route.ts
│       │       └── updates/route.ts  # Project updates (milestones/devlogs)
│       ├── comments/              # Comment management
│       │   ├── route.ts           # GET all comments
│       │   └── [id]/route.ts      # DELETE comment
│       ├── updates/[id]/route.ts  # DELETE project update
│       ├── whispers/              # Private feedback
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/route.ts      # PATCH (mark as read)
│       ├── users/                 # User management
│       │   ├── route.ts           # POST (create/update)
│       │   └── [id]/
│       │       ├── route.ts       # GET, PATCH
│       │       ├── likes/route.ts # User's liked projects
│       │       └── withdraw/route.ts  # Account withdrawal
│       ├── ai/generate/route.ts   # AI content generation
│       ├── upload/route.ts        # Image uploads (Vercel Blob)
│       ├── stats/route.ts         # Platform statistics
│       ├── digests/               # @deprecated Digest system
│       ├── admin/seed/route.ts    # Admin: seed data
│       └── cron/digest/route.ts   # @deprecated Cron job for digests
│
├── components/                    # React components
│   ├── Layout.tsx                 # App wrapper with sticky header
│   ├── Dashboard.tsx              # Gallery with search, filter, pagination
│   ├── LandingPage.tsx            # Marketing landing page
│   ├── ProjectCard.tsx            # Grid card component
│   ├── AiCandidateSelector.tsx    # AI output comparison UI
│   ├── SafeMarkdown.tsx           # XSS-protected markdown renderer
│   ├── LoginModal.tsx             # Auth modal
│   ├── SocialLoginForm.tsx        # Social OAuth login form
│   ├── SignupProfileForm.tsx      # New user profile setup
│   ├── ProfileEditModal.tsx       # Profile editing modal
│   ├── WithdrawalModal.tsx        # Account withdrawal modal
│   ├── ConfirmModal.tsx           # Reusable confirmation dialog
│   ├── UserMenu.tsx               # User dropdown menu
│   ├── Hero.tsx                   # Dashboard hero section
│   ├── Button.tsx                 # Reusable button component
│   ├── ContactButton.tsx          # Floating contact button
│   ├── MultiLinkInput.tsx         # Multi-store link input (drag & drop)
│   ├── StoreBadges.tsx            # Store/platform badges display
│   ├── ShareSheet.tsx             # Social sharing bottom sheet
│   ├── ProjectUpdateModal.tsx     # Create milestone/devlog modal
│   ├── ProjectUpdateTimeline.tsx  # Timeline of project updates
│   ├── form/
│   │   └── FormField.tsx          # Reusable form field component
│   └── lunchbox/                  # @deprecated
│       ├── LunchboxCard.tsx
│       └── LocationPicker.tsx
│
├── contexts/
│   └── AuthContext.tsx            # Firebase auth state & API client init
│
├── hooks/                         # Custom React hooks
│   ├── index.ts                   # Central export
│   ├── useRequireAuth.ts          # Navigation guard for protected pages
│   ├── useImageUpload.ts          # Image upload with validation
│   ├── useTagInput.ts             # Tag input management
│   ├── useAiGeneration.ts         # AI content generation with limits
│   └── useProjectForm.ts          # Project form state management
│
├── services/
│   └── geminiService.ts           # Server-side Gemini AI integration
│
├── lib/                           # Utilities & types
│   ├── types.ts                   # Frontend TypeScript interfaces
│   ├── db-types.ts                # Firestore document & API response types
│   ├── digest-types.ts            # @deprecated Digest system types
│   ├── firebase.ts                # Firebase client SDK initialization
│   ├── firebase-admin.ts          # Firebase Admin SDK setup
│   ├── api-client.ts              # Authenticated API client with caching
│   ├── auth-utils.ts              # Token verification utilities
│   ├── admin-utils.ts             # Admin authorization utilities
│   ├── admin-constants.ts         # User roles & permissions
│   ├── security-utils.ts          # Input validation & sanitization
│   ├── sanitize-utils.ts          # XSS prevention (DOMPurify)
│   ├── rate-limiter.ts            # Sliding window rate limiting
│   ├── file-validation.ts         # Magic number file validation
│   ├── nickname-validation.ts     # Korean nickname validation
│   ├── draftService.ts            # LocalStorage draft management
│   ├── constants.ts               # Reaction emoji mappings
│   ├── form-constants.ts          # Form constraints & messages
│   ├── site.ts                    # Site domain & URL configuration
│   ├── seo-config.ts              # SEO metadata & JSON-LD schemas
│   ├── share-utils.ts             # Web Share API & social sharing
│   ├── og-utils.ts                # OG image generation utilities
│   ├── legal-versions.ts          # Legal document versions
│   ├── lunchbox-text.ts           # @deprecated Digest UI text
│   ├── geocoding.ts               # @deprecated Location services
│   └── schemas/                   # Centralized Zod schemas
│       ├── index.ts               # Central export
│       ├── common.ts              # Shared schemas (URL, tags, etc.)
│       ├── project.ts             # Project form & update schemas
│       └── user.ts                # User & withdrawal schemas
│
└── __tests__/                     # Test files
    ├── setup.ts                   # Vitest setup
    ├── helpers/mock-firebase.ts   # Firebase mocking utilities
    ├── security-utils.test.ts     # Security utilities tests
    ├── sanitize-utils.test.ts     # XSS prevention tests
    ├── rate-limiter.test.ts       # Rate limiter tests
    ├── file-validation.test.ts    # File validation tests
    ├── auth-utils.test.ts         # Auth utilities tests
    ├── api/projects.test.ts       # API endpoint tests
    └── schemas/                   # Schema validation tests
        ├── common.test.ts
        ├── project.test.ts
        └── user.test.ts
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Root entry - landing page |
| `src/app/layout.tsx` | Root layout with AuthProvider, SEO, JSON-LD structured data |
| `src/app/dashboard/page.tsx` | Main gallery with search, filter, pagination |
| `src/app/menu/register/page.tsx` | Project submission with AI-powered form |
| `src/app/menu/[id]/page.tsx` | Project detail with updates timeline |
| `src/contexts/AuthContext.tsx` | Firebase auth state & API client initialization |
| `src/lib/api-client.ts` | Centralized API client with cache & deduplication |
| `src/services/geminiService.ts` | Server-side AI content generation |
| `src/lib/security-utils.ts` | Input validation & sanitization utilities |
| `src/lib/schemas/index.ts` | Centralized Zod validation schemas |

## Claude Code Resources

프로젝트별 Skills와 Agents가 구성되어 있어 복잡한 작업 시 자동으로 참조됨.

### Skills (`.claude/skills/`)
| Skill | 용도 |
|-------|------|
| `create-component.md` | React 컴포넌트 생성 |
| `styling.md` | Tailwind CSS 스타일링 |
| `korean-ux.md` | 한국어 UX 텍스트 |
| `gemini-ai.md` | AI 콘텐츠 생성 |
| `project-feature.md` | 프로젝트 필드 추가 |
| `security.md` | 보안 기능 구현 |
| `testing.md` | Vitest 테스트 작성 |
| `api-endpoint.md` | API 라우트 생성 |
| `firebase-operations.md` | Firestore 작업 |
| `form-validation.md` | 폼 검증 (Zod) |
| `debugging.md` | 디버깅 및 에러 해결 |

### Agents (`.claude/agents/`)
| Agent | 용도 |
|-------|------|
| `code-reviewer` | 코드 리뷰 및 품질 검사 |
| `security-scanner` | 보안 취약점 스캔 |
| `test-writer` | 테스트 코드 작성 |
| `korean-copywriter` | 한국어 카피 작성 |
| `firebase-helper` | Firebase 쿼리 지원 |
| `api-designer` | API 설계 및 구현 |
| `performance-analyzer` | 성능 분석 및 최적화 |
| `backend-architect` | 백엔드 아키텍처 설계 |

## Development Commands

```bash
pnpm install        # Install dependencies
pnpm dev            # Start dev server with Turbopack (port 3000)
pnpm build          # Production build
pnpm start          # Run production server
pnpm lint           # Run ESLint
pnpm test           # Run tests with Vitest (watch mode)
pnpm test:run       # Run tests once
pnpm test:coverage  # Run tests with coverage report
```

## Environment Setup

Create `.env.local` with:
```bash
# Gemini AI
GEMINI_API_KEY=your_gemini_api_key

# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Firebase Admin (server-side)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY=...

# Vercel Blob Storage
BLOB_READ_WRITE_TOKEN=...

# Site Configuration (optional)
NEXT_PUBLIC_SITE_URL=https://sidedish.me

# SEO Verification (optional)
GOOGLE_SITE_VERIFICATION=...
NAVER_SITE_VERIFICATION=...
```

## API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/projects` | GET | No | List projects (paginated, searchable) |
| `/api/projects` | POST | Yes | Create project |
| `/api/projects/[id]` | GET | No | Get project details |
| `/api/projects/[id]` | PATCH | Yes | Update project (owner only) |
| `/api/projects/[id]` | DELETE | Yes | Delete project (owner only) |
| `/api/projects/[id]/comments` | GET/POST | POST only | Comments |
| `/api/projects/[id]/like` | GET/POST/DELETE | Yes | Like/unlike |
| `/api/projects/[id]/reactions` | GET/POST | POST only | Reactions |
| `/api/projects/[id]/updates` | GET/POST | POST only | Project updates (milestones/devlogs) |
| `/api/updates/[id]` | DELETE | Yes | Delete project update (owner only) |
| `/api/comments` | GET | No | List all comments |
| `/api/comments/[id]` | DELETE | Yes | Delete comment (owner only) |
| `/api/whispers` | GET/POST | Yes | Private feedback to authors |
| `/api/whispers/[id]` | PATCH | Yes | Mark whisper as read |
| `/api/users` | POST | Optional | Create/update user |
| `/api/users/[id]` | GET/PATCH | PATCH only | User profile |
| `/api/users/[id]/likes` | GET | Yes | User's liked projects |
| `/api/users/[id]/withdraw` | POST | Yes | Account withdrawal (soft delete) |
| `/api/ai/generate` | GET/POST | Yes | AI content generation |
| `/api/upload` | POST | Yes | Image upload to Vercel Blob |
| `/api/stats` | GET | No | Platform statistics |

## Code Conventions

### Component Patterns

1. **Client Components**: Use `'use client'` directive at top of file
   ```tsx
   'use client'

   import { useState } from 'react'
   ```

2. **Server Actions**: Use `'use server'` for server-side functions
   ```tsx
   'use server'

   export const generateContent = async () => { ... }
   ```

3. **Component Definition**: Use `React.FC` with explicit interface
   ```tsx
   interface Props {
     title: string
     onClick?: () => void
   }

   const Component: React.FC<Props> = ({ title, onClick }) => { ... }

   export default Component
   ```

4. **Path Aliases**: Use `@/*` for imports from `src/`
   ```tsx
   import { Project } from '@/lib/types'
   import Button from '@/components/Button'
   ```

### Form Validation Pattern

Use React Hook Form with Zod schemas from `src/lib/schemas/`:

```tsx
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { projectFormSchema, type ProjectFormData } from '@/lib/schemas'

const { control, handleSubmit, formState: { errors } } = useForm<ProjectFormData>({
  resolver: zodResolver(projectFormSchema),
  mode: 'onChange',
})
```

### Custom Hooks Pattern

Use the centralized hooks from `src/hooks/`:

```tsx
import {
  useImageUpload,
  useTagInput,
  useAiGeneration,
  useProjectForm,
  useRequireAuth,
} from '@/hooks'

// In component
const { uploadImage, isUploading, error } = useImageUpload()
const { tags, addTag, removeTag } = useTagInput({ maxTags: 5 })
const { generate, isGenerating, limitInfo } = useAiGeneration({ draftId })
```

### Styling Conventions

1. **Tailwind CSS 4**: Uses new `@import "tailwindcss"` syntax
2. **Custom Theme**: Defined in `globals.css` using `@theme` directive
3. **Design System**:
   - Primary: Indigo (`indigo-600`, `indigo-700`)
   - Accent: Orange (`orange-500`, `orange-600`)
   - Neutral: Slate (`slate-50` to `slate-900`)
   - Background: `#F8FAFC` (slate-50)
4. **Glassmorphism**: Common pattern with `bg-white/70 backdrop-blur-xl`
5. **Border Radius**: Large radii (`rounded-xl`, `rounded-2xl`, `rounded-[2.5rem]`)
6. **Animations**: Custom animations defined in `globals.css`:
   - `animate-in`, `fade-in`, `slide-in-from-bottom-*`, `zoom-in-*`
   - Duration classes: `duration-200` to `duration-1000`
   - Delay classes: `delay-100` to `delay-300`

## Security Features

### Input Validation (`src/lib/security-utils.ts`)

Enterprise-grade validation following OWASP guidelines:

```tsx
import {
  validateString,
  validateUrl,
  validateTags,
  isValidReactionKey,
  isValidPlatform,
  isValidDocumentId,
  CONTENT_LIMITS,
} from '@/lib/security-utils'

// Content length limits
CONTENT_LIMITS.USER_NAME_MAX       // 20
CONTENT_LIMITS.PROJECT_TITLE_MAX   // 100
CONTENT_LIMITS.PROJECT_DESC_MAX    // 10000
CONTENT_LIMITS.COMMENT_MAX         // 1000
CONTENT_LIMITS.WHISPER_MAX         // 2000

// Validation example
const result = validateString(input, 'fieldName', {
  required: true,
  minLength: 2,
  maxLength: 100,
})
if (!result.valid) return badRequestResponse(result.error)
```

### XSS Prevention (`src/lib/sanitize-utils.ts`)

Client-side sanitization using DOMPurify:

```tsx
import { sanitizeHtml, sanitizePlainText, containsDangerousPatterns } from '@/lib/sanitize-utils'

// For markdown content (allows safe HTML)
const safeHtml = sanitizeHtml(userContent)

// For plain text (strips all HTML)
const safeText = sanitizePlainText(comment)

// Check for suspicious content
if (containsDangerousPatterns(content)) {
  console.warn('Dangerous patterns detected')
}
```

Use `SafeMarkdown` component for rendering user content:

```tsx
import SafeMarkdown from '@/components/SafeMarkdown'

<SafeMarkdown className="prose">{description}</SafeMarkdown>
```

### Rate Limiting (`src/lib/rate-limiter.ts`)

Sliding window rate limiter for API protection:

```tsx
import {
  checkRateLimit,
  RATE_LIMIT_CONFIGS,
  getClientIdentifier,
  createRateLimitKey,
} from '@/lib/rate-limiter'

// In API route
const clientIp = getClientIdentifier(request)
const rateLimitKey = createRateLimitKey(userId, clientIp)
const { allowed, remaining, resetMs } = checkRateLimit(
  rateLimitKey,
  RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE
)

if (!allowed) {
  return rateLimitResponse(remaining, resetMs)
}
```

Preset configurations:
- `PUBLIC_READ`: 60 req/min
- `AUTHENTICATED_READ`: 120 req/min
- `AUTHENTICATED_WRITE`: 30 req/min
- `SENSITIVE`: 5 req/hour
- `UPLOAD`: 10 req/min
- `AI_GENERATE`: 5 req/min

### File Validation (`src/lib/file-validation.ts`)

Magic number validation to prevent malicious file uploads:

```tsx
import { validateMagicNumber } from '@/lib/file-validation'

const buffer = Buffer.from(await file.arrayBuffer())
if (!validateMagicNumber(buffer, file.type)) {
  return badRequestResponse('Invalid file type')
}
```

Supported types: JPEG, PNG, GIF, WebP

## TypeScript Types

### Frontend Types (`src/lib/types.ts`)

```tsx
// Project platform types
type ProjectPlatform =
  | 'WEB'        // 웹 서비스/웹앱/SaaS
  | 'MOBILE'     // 모바일 앱 (iOS/Android)
  | 'DESKTOP'    // 데스크탑 앱 (Windows/macOS/Linux)
  | 'GAME'       // 게임 (PC/모바일/콘솔)
  | 'EXTENSION'  // 확장 프로그램 (브라우저, IDE, 에디터)
  | 'LIBRARY'    // 라이브러리/패키지/CLI 도구
  | 'DESIGN'     // 디자인/템플릿/리소스
  | 'OTHER'      // 기타
  | 'APP'        // @deprecated - MOBILE 또는 DESKTOP 사용 권장

// Store types for multi-link support
type StoreType =
  // Mobile
  | 'APP_STORE' | 'PLAY_STORE' | 'GALAXY_STORE'
  // Desktop
  | 'MAC_APP_STORE' | 'WINDOWS_STORE' | 'DIRECT_DOWNLOAD'
  // Game
  | 'STEAM' | 'EPIC_GAMES' | 'ITCH_IO' | 'GOG'
  // Extensions
  | 'CHROME_WEB_STORE' | 'FIREFOX_ADDONS' | 'EDGE_ADDONS' | 'VS_CODE'
  // Packages
  | 'NPM' | 'PYPI'
  // General
  | 'WEBSITE' | 'GITHUB' | 'FIGMA' | 'NOTION' | 'OTHER'

// Project link structure (max 8 links per project)
interface ProjectLink {
  id: string
  storeType: StoreType
  url: string
  label?: string      // Custom label
  isPrimary?: boolean // Primary link flag
}

// Reaction types
type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love'
type Reactions = Partial<Record<ReactionKey, number>>

interface Project {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  author: string
  likes: number
  reactions: Reactions
  comments: Comment[]
  link: string           // @deprecated - use links array
  githubUrl?: string     // @deprecated - use links array
  links?: ProjectLink[]  // Multi-store links (max 8)
  platform: ProjectPlatform
  isBeta?: boolean       // Beta/development flag
  createdAt: Date
}
```

### Database Types (`src/lib/db-types.ts`)

```tsx
import { Timestamp } from 'firebase-admin/firestore'

// User roles for admin system
type UserRole = 'user' | 'admin' | 'master'

// Firestore document structures use Timestamp
interface ProjectDoc {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  authorId: string
  authorName: string
  likes: number
  reactions: Reactions
  link: string
  githubUrl?: string
  links?: ProjectLinkDoc[]
  platform: ProjectPlatform
  isBeta?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// Project updates (milestones & devlogs)
type ProjectUpdateType = 'milestone' | 'devlog'

interface ProjectUpdateDoc {
  id: string
  projectId: string
  authorId: string
  authorName: string
  type: ProjectUpdateType
  title: string      // "v1.0 출시" or "로그인 기능 구현 중"
  content: string    // Markdown content
  version?: string   // For milestones: "1.0.0", "Beta 2"
  emoji?: string     // For milestones: 🎉, 🚀, 🐛, ✨
  createdAt: Timestamp
}

interface UserDoc {
  id: string
  email?: string
  name: string
  avatarUrl: string
  role?: UserRole
  agreements?: UserAgreements
  isProfileComplete: boolean
  isWithdrawn?: boolean
  withdrawnAt?: Timestamp
  withdrawalReason?: string
  withdrawalFeedback?: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

// API responses use ISO strings for dates
interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}
```

## Admin Role System

User roles are defined in `src/lib/admin-constants.ts`:

```tsx
type UserRole = 'user' | 'admin' | 'master'

// Role levels for permission checking
const ROLE_LEVELS = { user: 0, admin: 1, master: 2 }

// Check if user has admin+ permissions
isAdmin(user?.role)  // true for admin or master

// Check for master only
isMaster(user?.role)

// Check specific permission level
hasPermission(userRole, 'admin')
```

## Project Updates Feature

Projects can have updates (milestones & devlogs):

```tsx
// Create update via API
POST /api/projects/[id]/updates
{
  type: 'milestone' | 'devlog',
  title: 'v1.0 Release',
  content: 'Description in markdown...',
  version: '1.0.0',       // Optional, for milestones
  emoji: '🚀'             // Optional, for milestones
}

// Available milestone emojis (from form-constants.ts)
const MILESTONE_EMOJIS = [
  '🎉', '🚀', '✨', '🐛', '🔧', '📦',
  '🎨', '⚡', '🔒', '📝', '🌟', '💡'
]
```

## Multi-Link System

Projects support multiple store/platform links:

```tsx
// Max 8 links per project
const MAX_PROJECT_LINKS = 8

// Link structure in project form
interface ProjectLink {
  id: string           // nanoid generated
  storeType: StoreType // Store platform type
  url: string
  label?: string       // Custom display label
  isPrimary?: boolean  // Primary/main link
}

// Components for multi-link UI
import MultiLinkInput from '@/components/MultiLinkInput'  // Drag & drop editor
import StoreBadges from '@/components/StoreBadges'        // Display badges
```

## AI Integration

### Gemini Service (`src/services/geminiService.ts`)

Server-side AI functions using Gemini 2.5 Flash Lite:

1. **`generateProjectContent(draft: string)`**: Generates complete project content
   - Returns: `{ shortDescription, description, tags }`
   - Uses JSON schema for structured output
   - Korean language with "Chef" persona

2. **`generateWeatherContent(input)`**: @deprecated Generates weather digest content
   - Returns: Temperature, outfit, precipitation, air quality tips
   - Includes fallback for AI failures

### AI Rate Limiting

Constraints defined in `src/lib/form-constants.ts`:

```tsx
const AI_CONSTRAINTS = {
  MAX_PER_DRAFT: 3,       // 3 generations per draft
  MAX_PER_DAY: 10,        // 10 generations per day per user
  COOLDOWN_MS: 5000,      // 5-second cooldown between requests
  MIN_DESC_LENGTH: 30,    // Minimum description length to generate
}
```

### AI Prompting Style
- Role: "SideDish Platform Editor"
- Language: Korean (polite 해요체, witty)
- Metaphors: Subtle cooking/culinary themed
- Output: Markdown with moderate emoji usage
- Banned: Clichés like "최고의", "혁신적인"

## Authentication

### Firebase Auth Setup

```tsx
// src/contexts/AuthContext.tsx provides:
interface AuthContextType {
  user: User | null
  firebaseUser: FirebaseUser | null
  isLoading: boolean
  isAuthenticated: boolean
  isConfigured: boolean
  needsProfileSetup: boolean
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
  refreshUser: () => Promise<void>
}

// Usage in components:
const { user, isAuthenticated, signInWithGoogle, needsProfileSetup } = useAuth()
```

### New User Registration Flow

1. User signs in with Google/GitHub
2. `AuthContext` checks if profile exists in Firestore
3. If new user: `needsProfileSetup = true` → Show `SignupProfileForm`
4. User fills: nickname, avatar (optional), terms acceptance
5. Profile saved via `updateUser` API
6. `isProfileComplete = true` → Full access granted

### Protected Routes

```tsx
import { useRequireAuth } from '@/hooks/useRequireAuth'

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth()
  if (isLoading) return <Loading />
  // user is guaranteed to exist here
}
```

## Social Sharing

Sharing utilities in `src/lib/share-utils.ts`:

```tsx
import {
  canUseWebShare,
  shareWithWebAPI,
  shareToplatform,
  copyToClipboard,
  shouldUseNativeShare,
} from '@/lib/share-utils'

// Check if native share is available (mobile)
if (shouldUseNativeShare()) {
  await shareWithWebAPI({ title, text, url })
} else {
  // Show custom share sheet
}

// Share to specific platform
shareToplatform('x', { title, text, url })
shareToplatform('facebook', { title, text, url })
shareToplatform('linkedin', { title, text, url })
shareToplatform('copy', { title, text, url })  // Copy to clipboard
```

## SEO & Structured Data

SEO configuration in `src/lib/seo-config.ts`:

```tsx
import {
  SEO_CONFIG,
  getCanonicalUrl,
  getPageTitle,
  getOgImageUrl,
  getOrganizationSchema,
  getWebSiteSchema,
  getProjectSchema,
  getBreadcrumbSchema,
  getFAQSchema,
} from '@/lib/seo-config'

// Generate JSON-LD for a project
const projectSchema = getProjectSchema({
  id: project.id,
  title: project.title,
  shortDescription: project.shortDescription,
  // ...
})

// In page component
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(projectSchema) }}
/>
```

## Site Configuration

Centralized domain configuration in `src/lib/site.ts`:

```tsx
import {
  SITE_DOMAIN,        // 'sidedish.me'
  SITE_URL,           // 'https://sidedish.me'
  CONTACT_EMAIL,      // 'contact@sidedish.me'
  NOREPLY_EMAIL,      // 'noreply@sidedish.me'
  TWITTER_HANDLE,     // '@sidedish_me'
  getPageUrl,         // Generate full URL for path
  getEmailFrom,       // Generate email from header
} from '@/lib/site'
```

**Important**: Never hardcode domain names. Always use these constants.

## Form Constants

Centralized form constraints in `src/lib/form-constants.ts`:

```tsx
import {
  PROJECT_CONSTRAINTS,    // Title, description limits
  FILE_CONSTRAINTS,       // Upload size, types
  AI_CONSTRAINTS,         // Rate limits
  FORM_TIMING,           // Debounce, cooldown times
  PAGINATION,            // Page sizes
  MILESTONE_EMOJIS,      // Available milestone emojis
  FORM_ERROR_MESSAGES,   // Error message templates
  FORM_SUCCESS_MESSAGES, // Success message templates
} from '@/lib/form-constants'

// Example usage
if (title.length > PROJECT_CONSTRAINTS.TITLE_MAX_LENGTH) {
  return FORM_ERROR_MESSAGES.TITLE_TOO_LONG
}
```

## API Client

### Authenticated Requests

```tsx
import { createProject, getProjects, toggleLike } from '@/lib/api-client'

// Automatically includes Bearer token from AuthContext
const project = await createProject({
  title: 'My Project',
  description: '...',
  links: [{ id: '1', storeType: 'WEBSITE', url: 'https://...', isPrimary: true }],
})
```

### Caching & Deduplication

- **30s cache TTL** for general requests
- **5min cache TTL** for user profiles
- **1min cache TTL** for AI usage info
- **Request deduplication** prevents duplicate in-flight requests
- **Pattern-based invalidation**: `invalidateCache('projects')`

## Reactions System

```tsx
type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love'

// Emoji mapping in src/lib/constants.ts
const REACTION_EMOJI_MAP: Record<ReactionKey, string> = {
  fire: '🔥',
  clap: '👏',
  party: '🎉',
  idea: '💡',
  love: '🥰',
}

// Legacy emoji→key normalization for migration
normalizeReactions(oldData)
```

## Image Handling

Configured remote patterns in `next.config.ts`:
- `picsum.photos` - Placeholder images
- `images.unsplash.com` - Stock photos
- `avatars.githubusercontent.com` - GitHub avatars
- `lh3.googleusercontent.com` - Google avatars
- `*.public.blob.vercel-storage.com` - Uploaded images

**Validation requirements:**
- Max size: 5MB
- Allowed types: JPEG, PNG, WebP, GIF
- Magic number validation prevents disguised files

## State Management

- **No external state library** - Uses React hooks only
- **AuthContext** - Firebase auth state & API client
- **Client-side caching** - In-memory Map with TTL
- **Draft persistence** - LocalStorage with auto-save (1s debounce)
- **AI usage tracking** - LocalStorage for rate limiting

## Testing

### Running Tests

```bash
pnpm test           # Watch mode
pnpm test:run       # Single run
pnpm test:coverage  # With coverage report
```

### Test Structure

Tests are located in `src/__tests__/`:

```tsx
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('security-utils', () => {
  describe('validateString', () => {
    it('should validate required fields', () => {
      const result = validateString('', 'name', { required: true })
      expect(result.valid).toBe(false)
    })
  })
})
```

### Testing Schemas

Schema tests in `src/__tests__/schemas/`:

```tsx
import { projectFormSchema } from '@/lib/schemas'

describe('projectFormSchema', () => {
  it('validates valid project data', () => {
    const result = projectFormSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })
})
```

### Mocking Firebase

Use `src/__tests__/helpers/mock-firebase.ts`:

```tsx
import { mockFirebaseAdmin, resetMocks } from './helpers/mock-firebase'

beforeEach(() => {
  resetMocks()
  mockFirebaseAdmin()
})
```

## Common Tasks

### Adding a New Component
1. Create file in `src/components/ComponentName.tsx`
2. Add `'use client'` if using hooks/interactivity
3. Define props interface
4. Use `React.FC<Props>` pattern
5. Export as default

### Adding a New Page
1. Create folder in `src/app/page-name/`
2. Add `page.tsx` for the route
3. Optionally add `layout.tsx` for nested layout
4. Add auth protection with `useRequireAuth` if needed
5. Add SEO metadata using `generateMetadata`

### Adding a New API Endpoint
1. Create `src/app/api/endpoint-name/route.ts`
2. Use `verifyAuth` from `@/lib/auth-utils` for protected routes
3. Use validation from `@/lib/security-utils` or Zod schemas
4. Apply rate limiting from `@/lib/rate-limiter`
5. Access Firestore via `@/lib/firebase-admin`
6. Return proper status codes and error messages

### Adding New Project Fields
1. Update `Project` interface in `src/lib/types.ts`
2. Update `ProjectDoc` and `ProjectResponse` in `src/lib/db-types.ts`
3. Update Zod schemas in `src/lib/schemas/project.ts`
4. Update API routes to handle new fields
5. Add validation in `security-utils.ts` if needed
6. Update form components for input
7. Update display components for output

### Adding a Custom Hook
1. Create file in `src/hooks/useHookName.ts`
2. Export types for options and return value
3. Add export to `src/hooks/index.ts`
4. Add tests if complex logic

### Modifying AI Generation
1. Edit prompts in `src/services/geminiService.ts`
2. Adjust JSON schema if changing output structure
3. Update types if needed
4. Consider rate limit implications

### Adding Tests
1. Create test file in `src/__tests__/` with `.test.ts` extension
2. Import from `vitest` for test utilities
3. Use `describe/it/expect` pattern
4. Mock external dependencies (Firebase, fetch, etc.)

## Performance Optimizations

1. **Search debouncing** (300ms) in Dashboard
2. **Request deduplication** - No duplicate in-flight requests
3. **Request caching** - 30s TTL with pattern invalidation
4. **AbortController** - Cancel previous searches on new input
5. **Cursor pagination** - Scalable for large datasets
6. **Lazy loading** - More projects loaded on scroll
7. **Image optimization** - Next.js Image component + Vercel CDN
8. **Turbopack** - Fast dev server with HMR

## Important Notes

1. **Language**: UI text is in Korean - maintain consistency
2. **Mobile-First**: Responsive design with breakpoints (sm, md, lg, xl)
3. **Accessibility**: Maintain focus states, ARIA labels where needed
4. **Security**: All write operations require authentication + validation
5. **Performance**: Use Next.js Image component for optimized images
6. **Error Handling**: API client throws `ApiError` with status codes
7. **XSS Prevention**: Always use `SafeMarkdown` for user-generated content
8. **Rate Limiting**: Apply appropriate limits to all API endpoints
9. **Soft Delete**: User deletion is soft (data retained for compliance)
10. **Centralized Config**: Use `site.ts` for domain, `form-constants.ts` for limits
11. **Schema Validation**: Use Zod schemas from `src/lib/schemas/` for form validation
12. **Deprecated Features**: Lunchbox/Digest feature is deprecated but code remains for reference

## Database Collections (Firestore)

| Collection | Purpose | Key Fields |
|------------|---------|------------|
| `projects` | User projects | authorId, title, description, tags, likes, reactions, links, isBeta |
| `users` | User profiles | name, avatarUrl, role, agreements, isWithdrawn |
| `comments` | Project comments | projectId, authorId, content |
| `whispers` | Private feedback | projectId, projectAuthorId, senderId, isRead |
| `project_updates` | Milestones & devlogs | projectId, type, title, content, version, emoji |
| `digests` | @deprecated Digest definitions | name, slug, category, config |
| `digest_subscriptions` | @deprecated User subscriptions | userId, digestId, settings |
| `digest_logs` | @deprecated Delivery logs | digestId, deliveredAt, generatedContent |
