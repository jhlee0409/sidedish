---
name: adding-project-features
description: Adds new fields or features to Project entity. Use when extending project schema, adding new properties, updating forms, or modifying project display. Includes type updates, API changes, and validation.
---

# Add Project Feature Skill

## When to Use
- Adding new fields to Project (title, description, etc.)
- Extending project schema in types.ts and db-types.ts
- Updating API routes for new fields
- Adding form inputs for new properties
- Modifying ProjectCard or detail page display

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
// Firestore document structure
export interface ProjectDoc {
  id: string
  // ... existing fields
  newField: string  // Add here
  createdAt: Timestamp
  updatedAt: Timestamp
}

// API response structure
export interface ProjectResponse {
  id: string
  // ... existing fields
  newField: string  // Add here
  createdAt: string  // ISO string
  updatedAt: string
}
```

### 3. Add Security Validation (`src/lib/security-utils.ts`)

If the field needs validation:

```tsx
// Add to CONTENT_LIMITS if applicable
export const CONTENT_LIMITS = {
  // ...existing
  NEW_FIELD_MAX: 200,
} as const

// Add validation function if complex
export function validateNewField(
  value: unknown,
  fieldName: string = '새 필드'
): { valid: true; value: string } | { valid: false; error: string } {
  return validateString(value, fieldName, {
    required: true,
    maxLength: CONTENT_LIMITS.NEW_FIELD_MAX,
  })
}
```

### 4. Update API Routes

#### Create (`src/app/api/projects/route.ts` - POST)
```tsx
// In POST handler, add to projectData
const projectData = {
  // ...existing
  newField: body.newField || '',
}
```

#### Read (`src/app/api/projects/route.ts` - GET)
```tsx
// Already handled if added to types
return {
  ...docData,
  newField: doc.data().newField,
}
```

#### Update (`src/app/api/projects/[id]/route.ts` - PATCH)
```tsx
// Add validation
if (body.newField !== undefined) {
  const result = validateNewField(body.newField)
  if (!result.valid) return badRequestResponse(result.error)
  updateData.newField = result.value
}
```

### 5. Update Form Component

In `src/app/menu/register/page.tsx` or project form:

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
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
    placeholder="입력 안내 텍스트"
    maxLength={200}
  />
  <p className="text-xs text-slate-400">{newField.length}/200</p>
</div>

// Include in submit data
const projectData = {
  // ...existing
  newField,
}
```

### 6. Update Display Components

#### ProjectCard (`src/components/ProjectCard.tsx`)
If shown in card:
```tsx
<span className="text-sm text-slate-500">{project.newField}</span>
```

#### Detail Page (`src/app/menu/[id]/page.tsx`)
```tsx
<div className="mb-6">
  <h3 className="text-sm font-semibold text-slate-700 mb-1">새 필드</h3>
  <p className="text-slate-600">{project.newField}</p>
</div>
```

### 7. Update Draft Service (if applicable)

In `src/lib/draftService.ts`, add to DraftData:
```tsx
export interface DraftData {
  // ...existing
  newField: string
}

// Update default values
const defaultDraft: DraftData = {
  // ...existing
  newField: '',
}
```

### 8. Update AI Generation (if AI should generate it)

In `src/services/geminiService.ts`:
```tsx
const prompt = `
  // ...existing prompt
  Also generate: [what the new field should contain]
`

config: {
  responseSchema: {
    type: Type.OBJECT,
    properties: {
      // ...existing
      newField: { type: Type.STRING, description: "Description for AI" },
    },
    required: ["shortDescription", "description", "tags", "newField"]
  }
}
```

### 9. Add Tests

In `src/__tests__/`:
```tsx
describe('validateNewField', () => {
  it('should accept valid input', () => {
    const result = validateNewField('valid value')
    expect(result.valid).toBe(true)
  })

  it('should reject empty input', () => {
    const result = validateNewField('')
    expect(result.valid).toBe(false)
  })
})
```

## Adding New Platform Types

### 1. Update Types
```tsx
// src/lib/types.ts
export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER' | 'NEW_TYPE'
```

### 2. Update Security Utils
```tsx
// src/lib/security-utils.ts
export const ALLOWED_PLATFORMS = ['WEB', 'APP', 'GAME', 'DESIGN', 'OTHER', 'NEW_TYPE'] as const
```

### 3. Update UI
Add to platform filter in Dashboard and forms.

## Adding New Reaction Types

### 1. Update Constants
```tsx
// src/lib/constants.ts
export const REACTION_EMOJI_MAP: Record<ReactionKey, string> = {
  // ...existing
  newReaction: '🆕',
}
```

### 2. Update Types
```tsx
// src/lib/types.ts
export type ReactionKey = 'fire' | 'clap' | 'party' | 'idea' | 'love' | 'newReaction'
```

### 3. Update Security Utils
```tsx
// src/lib/security-utils.ts
export const ALLOWED_REACTION_KEYS = ['fire', 'clap', 'party', 'idea', 'love', 'newReaction'] as const
```

## Common Patterns

### Optional vs Required Fields
```tsx
// Optional field
newField?: string

// Required field with default
newField: string = ''
```

### Field with Enum
```tsx
type NewFieldType = 'option1' | 'option2' | 'option3'
newField: NewFieldType
```

### Field with Complex Type
```tsx
interface NewFieldData {
  subField1: string
  subField2: number
}
newField: NewFieldData
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
{project.newField && (
  <span>{project.newField}</span>
)}
```
