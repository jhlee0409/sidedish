# Add Project Feature Reference

## Checklist for Adding a New Project Field

### 1. Update Frontend Types (`src/lib/types.ts`)

```tsx
export interface Project {
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
  link: string
  githubUrl?: string
  platform: ProjectPlatform
  createdAt: Date
  // Add new field here
  newField: string
}
```

### 2. Update Database Types (`src/lib/db-types.ts`)

```tsx
export interface ProjectDoc {
  id: string
  // ... existing fields
  newField: string  // Add here
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ProjectResponse {
  id: string
  // ... existing fields
  newField: string  // Add here
  createdAt: string  // ISO string
  updatedAt: string
}
```

### 3. Add Security Validation (`src/lib/security-utils.ts`)

```tsx
export const CONTENT_LIMITS = {
  // ...existing
  NEW_FIELD_MAX: 200,
} as const

export function validateNewField(value: unknown, fieldName: string = '새 필드') {
  return validateString(value, fieldName, {
    required: true,
    maxLength: CONTENT_LIMITS.NEW_FIELD_MAX,
  })
}
```

### 4. Update API Routes

#### Create (`src/app/api/projects/route.ts` - POST)
```tsx
const projectData = {
  // ...existing
  newField: body.newField || '',
}
```

#### Update (`src/app/api/projects/[id]/route.ts` - PATCH)
```tsx
if (body.newField !== undefined) {
  const result = validateNewField(body.newField)
  if (!result.valid) return badRequestResponse(result.error)
  updateData.newField = result.value
}
```

### 5. Update Form Component

```tsx
// Add to form state
const [newField, setNewField] = useState('')

// Add input element
<div className="space-y-2">
  <label className="block text-sm font-semibold text-slate-700">
    새 필드 <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={newField}
    onChange={(e) => setNewField(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500"
    placeholder="입력 안내 텍스트"
    maxLength={200}
  />
  <p className="text-xs text-slate-400">{newField.length}/200</p>
</div>
```

### 6. Update Display Components

#### ProjectCard
```tsx
<span className="text-sm text-slate-500">{project.newField}</span>
```

#### Detail Page
```tsx
<div className="mb-6">
  <h3 className="text-sm font-semibold text-slate-700 mb-1">새 필드</h3>
  <p className="text-slate-600">{project.newField}</p>
</div>
```

### 7. Update Draft Service (if applicable)

```tsx
export interface DraftData {
  // ...existing
  newField: string
}

const defaultDraft: DraftData = {
  // ...existing
  newField: '',
}
```

### 8. Update AI Generation (if AI should generate it)

```tsx
const prompt = `Also generate: [what the new field should contain]`

config: {
  responseSchema: {
    properties: {
      newField: { type: Type.STRING, description: "Description for AI" },
    },
    required: ["shortDescription", "description", "tags", "newField"]
  }
}
```

## Adding New Platform Types

```tsx
// src/lib/types.ts
export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER' | 'NEW_TYPE'

// src/lib/security-utils.ts
export const ALLOWED_PLATFORMS = ['WEB', 'APP', 'GAME', 'DESIGN', 'OTHER', 'NEW_TYPE'] as const
```

## Adding New Reaction Types

```tsx
// src/lib/constants.ts
export const REACTION_EMOJI_MAP = {
  // ...existing
  newReaction: '🆕',
}

// src/lib/types.ts
export type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love' | 'newReaction'

// src/lib/security-utils.ts
export const ALLOWED_REACTION_KEYS = ['fire', 'clap', 'party', 'idea', 'love', 'newReaction'] as const
```

## Migration Considerations

When adding fields to existing data:

1. **Make field optional** or provide default value
2. **Handle null/undefined** in display components
3. **Consider backfill** for existing records if needed

```tsx
// Safe access with fallback
const displayValue = project.newField || '기본값'

// Or use optional chaining
{project.newField && <span>{project.newField}</span>}
```
