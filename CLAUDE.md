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
| AI | Google Generative AI (Gemini 2.5 Flash) | 1.0.0 |
| Icons | Lucide React | 0.468.0 |
| Package Manager | pnpm | 10.25.0 |
| Dev Server | Turbopack | (built-in) |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Root page - Landing/Dashboard view switcher
│   ├── layout.tsx         # Root layout with metadata & fonts
│   └── globals.css        # Global styles & custom animations
├── components/            # React components
│   ├── Dashboard.tsx      # Main project gallery with search/filter
│   ├── LandingPage.tsx    # Marketing landing page
│   ├── ProjectFormModal.tsx # Project submission form with AI generation
│   ├── ProjectDetail.tsx  # Full project detail view
│   ├── ProjectCard.tsx    # Grid card component
│   ├── Hero.tsx           # Dashboard hero section
│   ├── Layout.tsx         # App wrapper with sticky header
│   └── Button.tsx         # Reusable button component
├── lib/                   # Utilities & data
│   ├── types.ts           # TypeScript interfaces
│   └── constants.ts       # Mock project data
└── services/              # External services
    └── geminiService.ts   # Server-side Gemini AI integration
```

## Key Entry Points

| File | Purpose |
|------|---------|
| `src/app/page.tsx` | Main entry - manages view state between Landing and Dashboard |
| `src/app/layout.tsx` | Root layout with metadata, Korean language setup, Pretendard font |
| `src/components/Dashboard.tsx` | Core feature - project gallery with search, filter, CRUD |
| `src/services/geminiService.ts` | AI service - `'use server'` functions for Gemini API |

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
```
GEMINI_API_KEY=your_gemini_api_key_here
```

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

### TypeScript Types

Key interfaces in `src/lib/types.ts`:

```tsx
type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER'

interface Project {
  id: string
  title: string
  description: string        // Full markdown description
  shortDescription: string   // Max 80 chars tagline
  tags: string[]
  imageUrl: string
  author: string
  likes: number
  reactions: { [key: string]: number }
  comments: Comment[]
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Date
}

type CreateProjectInput = Omit<Project, 'id' | 'likes' | 'createdAt' | 'reactions' | 'comments'>
```

## AI Integration

### Gemini Service (`src/services/geminiService.ts`)

Two main functions:

1. **`generateProjectContent(draft: string)`**: Generates complete project content
   - Returns: `{ shortDescription, description, tags }`
   - Uses JSON schema response for structured output
   - Korean language output with "Chef" persona

2. **`refineDescription(rawDescription: string)`**: Polishes existing descriptions
   - Returns refined markdown text
   - Uses cooking metaphors subtly

### AI Prompting Style
- Role: "Executive Chef & Product Marketer for SideDish"
- Language: Korean (Natural, engaging, professional)
- Metaphors: Cooking/culinary themed ("Tasting Spoon", "Chef's Recommendation")
- Output: Markdown with moderate emoji usage

## Image Handling

Configured remote patterns in `next.config.ts`:
- `picsum.photos` - Placeholder images
- `images.unsplash.com` - Stock photos

For new image sources, add to `images.remotePatterns` array.

## State Management

- **No external state library** - Uses React hooks (`useState`, `useRef`, `useEffect`)
- **Client-side state** for UI: search, filters, modals, view switching
- **Mock data** in `src/lib/constants.ts` (no backend currently)

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

### Modifying AI Generation
1. Edit prompts in `src/services/geminiService.ts`
2. Adjust JSON schema if changing output structure
3. Update types in `src/lib/types.ts` if needed

### Adding New Project Fields
1. Update `Project` interface in `src/lib/types.ts`
2. Update `CreateProjectInput` if applicable
3. Modify `ProjectFormModal.tsx` for form input
4. Update `ProjectCard.tsx` and `ProjectDetail.tsx` for display
5. Add mock data in `src/lib/constants.ts`

## Important Notes

1. **Language**: UI text is in Korean - maintain consistency
2. **No Backend**: Currently uses mock data; prepare for API integration
3. **Mobile-First**: Responsive design with breakpoints (sm, md, lg, xl)
4. **Accessibility**: Maintain focus states, ARIA labels where needed
5. **Performance**: Use Next.js Image component for optimized images

## Testing

No test framework currently configured. When adding tests:
- Recommend: Jest + React Testing Library
- Add to `package.json` scripts
- Create `__tests__` folders or `.test.tsx` files
