# CLAUDE.md - AI Assistant Guide for SideDish

## Project Overview

**SideDish** is an AI-powered marketplace platform where developers showcase their side projects. It uses a culinary metaphor throughout:
- Projects = "Dishes"
- Developers = "Chefs"
- Users = "Diners"
- Platform = "Restaurant/Menu"

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
| Icons | Lucide React | 0.468.0 |
| Package Manager | pnpm | 10.25.0 |
| Dev Server | Turbopack | (built-in) |

## Project Structure

```
src/
├── app/                           # Next.js App Router
│   ├── page.tsx                   # Root - Landing page
│   ├── layout.tsx                 # Root layout with AuthProvider
│   ├── globals.css                # Global styles & Tailwind 4 config
│   ├── dashboard/page.tsx         # Project gallery with search/filter
│   ├── menu/
│   │   ├── register/page.tsx      # Project submission form
│   │   ├── [id]/page.tsx          # Project detail view
│   │   └── edit/[id]/page.tsx     # Project edit form
│   ├── login/page.tsx             # Firebase login
│   ├── signup/page.tsx            # Firebase signup
│   ├── mypage/page.tsx            # User profile & liked projects
│   └── api/                       # REST API endpoints (15 routes)
│       ├── projects/              # CRUD operations
│       ├── comments/              # Comment management
│       ├── whispers/              # Private feedback
│       ├── users/                 # User profiles
│       ├── ai/generate/           # AI content generation
│       ├── upload/                # Image uploads (Vercel Blob)
│       └── stats/                 # Platform statistics
│
├── components/                    # React components
│   ├── Layout.tsx                 # App wrapper with sticky header
│   ├── Dashboard.tsx              # Gallery with search, filter, pagination
│   ├── LandingPage.tsx            # Marketing landing page
│   ├── ProjectCard.tsx            # Grid card component
│   ├── ProjectFormModal.tsx       # Form with AI generation
│   ├── AiCandidateSelector.tsx    # AI output comparison UI
│   ├── LoginModal.tsx             # Auth modal
│   ├── UserMenu.tsx               # User dropdown menu
│   ├── Hero.tsx                   # Dashboard hero section
│   └── Button.tsx                 # Reusable button component
│
├── contexts/
│   └── AuthContext.tsx            # Firebase auth state & API client init
│
├── hooks/
│   └── useRequireAuth.ts          # Navigation guard for protected pages
│
├── services/
│   └── geminiService.ts           # Server-side Gemini AI integration
│
└── lib/                           # Utilities & types
    ├── types.ts                   # Frontend TypeScript interfaces
    ├── db-types.ts                # Firestore document & API response types
    ├── firebase.ts                # Firebase client SDK initialization
    ├── firebase-admin.ts          # Firebase Admin SDK setup
    ├── api-client.ts              # Authenticated API client with caching
    ├── auth-utils.ts              # Token verification utilities
    ├── draftService.ts            # LocalStorage draft management
    ├── aiLimitService.ts          # AI rate limiting (3/draft, 10/day)
    ├── constants.ts               # Reaction emoji mappings
    └── og-utils.ts                # OG image generation utilities
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Root entry - landing page |
| `src/app/layout.tsx` | Root layout wrapping all routes with AuthProvider |
| `src/app/dashboard/page.tsx` | Main gallery with search, filter, pagination |
| `src/app/menu/register/page.tsx` | Project submission with AI-powered form |
| `src/contexts/AuthContext.tsx` | Firebase auth state & API client initialization |
| `src/lib/api-client.ts` | Centralized API client with cache & deduplication |
| `src/services/geminiService.ts` | Server-side AI content generation |

## Development Commands

```bash
pnpm install     # Install dependencies
pnpm dev         # Start dev server with Turbopack (port 3000)
pnpm build       # Production build
pnpm start       # Run production server
pnpm lint        # Run ESLint
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
| `/api/comments/[id]` | DELETE | Yes | Delete comment (owner only) |
| `/api/whispers` | GET/POST | Yes | Private feedback to authors |
| `/api/whispers/[id]` | PATCH | Yes | Mark whisper as read |
| `/api/users` | POST | Optional | Create/update user |
| `/api/users/[id]` | GET/PATCH | PATCH only | User profile |
| `/api/users/[id]/likes` | GET | Yes | User's liked projects |
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

## TypeScript Types

### Frontend Types (`src/lib/types.ts`)

```tsx
type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'
type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love'
type Reactions = Partial<Record<ReactionKey, number>>

interface Project {
  id: string
  title: string
  description: string        // Full markdown description
  shortDescription: string   // Max 80 chars tagline
  tags: string[]
  imageUrl: string
  author: string
  likes: number
  reactions: Reactions
  comments: Comment[]
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Date
}

interface DraftData {
  id: string
  title: string
  shortDescription: string
  description: string
  tags: string[]
  imageUrl: string
  link: string
  githubUrl: string
  platform: ProjectPlatform
  aiCandidates: AiGenerationCandidate[]
  selectedCandidateId: string | null
  generationCount: number
  lastSavedAt: number
  createdAt: number
}
```

### Database Types (`src/lib/db-types.ts`)

```tsx
// Firestore document structures use Timestamp
interface ProjectDoc {
  id: string
  title: string
  description: string
  shortDescription: string
  tags: string[]
  imageUrl: string
  authorId: string           // Firebase UID
  authorName: string
  likes: number
  reactions: Reactions
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Timestamp
  updatedAt: Timestamp
}

// API responses use ISO strings for dates
interface ProjectResponse {
  // ... same fields with createdAt: string, updatedAt: string
}

interface PaginatedResponse<T> {
  data: T[]
  nextCursor?: string
  hasMore: boolean
}
```

## AI Integration

### Gemini Service (`src/services/geminiService.ts`)

Two server-side functions:

1. **`generateProjectContent(draft: string)`**: Generates complete project content
   - Returns: `{ shortDescription, description, tags }`
   - Uses JSON schema for structured output
   - Korean language with "Chef" persona

2. **`refineDescription(rawDescription: string)`**: Polishes existing descriptions
   - Returns refined markdown text
   - Subtle cooking metaphors

### AI Rate Limiting

- **3 generations per draft** - tracked by draft ID
- **10 generations per day per user**
- **5-second cooldown** between generations
- Tracked in localStorage (client-side) + server validation

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
  signInWithGoogle: () => Promise<void>
  signInWithGithub: () => Promise<void>
  signOut: () => Promise<void>
  getIdToken: () => Promise<string | null>
}

// Usage in components:
const { user, isAuthenticated, signInWithGoogle } = useAuth()
```

### Protected Routes

```tsx
// Use useRequireAuth hook for pages requiring login
import { useRequireAuth } from '@/hooks/useRequireAuth'

function ProtectedPage() {
  const { user, isLoading } = useRequireAuth()
  if (isLoading) return <Loading />
  // user is guaranteed to exist here
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
  // ...
})
```

### Caching & Deduplication

- **30s cache TTL** for general requests
- **5min cache TTL** for user profiles
- **Request deduplication** prevents duplicate in-flight requests
- **Pattern-based invalidation**: `invalidateCache('projects')`

## Reactions System

```tsx
// Strongly typed reaction keys
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
normalizeReactions(oldData) // Converts '🔥' keys to 'fire'
```

## Image Handling

Configured remote patterns in `next.config.ts`:
- `picsum.photos` - Placeholder images
- `images.unsplash.com` - Stock photos
- `avatars.githubusercontent.com` - GitHub avatars
- `lh3.googleusercontent.com` - Google avatars
- `*.public.blob.vercel-storage.com` - Uploaded images

Upload images via `/api/upload` endpoint → Vercel Blob storage.

## State Management

- **No external state library** - Uses React hooks only
- **AuthContext** - Firebase auth state & API client
- **Client-side caching** - In-memory Map with TTL
- **Draft persistence** - LocalStorage with auto-save (1s debounce)
- **AI usage tracking** - LocalStorage for rate limiting

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

### Adding a New API Endpoint
1. Create `src/app/api/endpoint-name/route.ts`
2. Use `verifyAuth` from `@/lib/auth-utils` for protected routes
3. Access Firestore via `@/lib/firebase-admin`
4. Return proper status codes and error messages

### Adding New Project Fields
1. Update `Project` interface in `src/lib/types.ts`
2. Update `ProjectDoc` and `ProjectResponse` in `src/lib/db-types.ts`
3. Update API routes to handle new fields
4. Modify `ProjectFormModal.tsx` for form input
5. Update `ProjectCard.tsx` and detail views for display

### Modifying AI Generation
1. Edit prompts in `src/services/geminiService.ts`
2. Adjust JSON schema if changing output structure
3. Update types if needed
4. Consider rate limit implications

## Performance Optimizations

1. **Search debouncing** (300ms) in Dashboard
2. **Request deduplication** - No duplicate in-flight requests
3. **Request caching** - 30s TTL with pattern invalidation
4. **AbortController** - Cancel previous searches on new input
5. **Cursor pagination** - Scalable for large datasets
6. **Lazy loading** - More projects loaded on scroll

## Important Notes

1. **Language**: UI text is in Korean - maintain consistency
2. **Mobile-First**: Responsive design with breakpoints (sm, md, lg, xl)
3. **Accessibility**: Maintain focus states, ARIA labels where needed
4. **Security**: All write operations require authentication
5. **Performance**: Use Next.js Image component for optimized images
6. **Error Handling**: API client throws `ApiError` with status codes

## Testing

No test framework currently configured. When adding tests:
- Recommend: Jest + React Testing Library
- Add to `package.json` scripts
- Create `__tests__` folders or `.test.tsx` files
