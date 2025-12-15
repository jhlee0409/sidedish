# Add Project Feature Skill

## When to Use
Use this skill when adding new fields or features to the Project entity.

## Steps to Add a New Project Field

### 1. Update Types (`src/lib/types.ts`)

```tsx
export interface Project {
  id: string
  title: string
  // ... existing fields
  newField: string  // Add new field
}

// Update CreateProjectInput if it's user-provided
export type CreateProjectInput = Omit<Project, 'id' | 'likes' | 'createdAt' | 'reactions' | 'comments'>
```

### 2. Update Mock Data (`src/lib/constants.ts`)

Add the new field to all mock projects:
```tsx
export const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    // ... existing fields
    newField: 'value',
  },
  // ... update all projects
]
```

### 3. Update Form (`src/components/ProjectFormModal.tsx`)

Add form input for the new field:
```tsx
// Add to form state
const [newField, setNewField] = useState('')

// Add input element
<div>
  <label className="block text-sm font-semibold text-slate-700 mb-2">
    새 필드 <span className="text-red-500">*</span>
  </label>
  <input
    type="text"
    value={newField}
    onChange={(e) => setNewField(e.target.value)}
    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all"
    placeholder="플레이스홀더 텍스트"
  />
</div>

// Include in submit
const projectData: CreateProjectInput = {
  // ... existing fields
  newField,
}
```

### 4. Update Card Display (`src/components/ProjectCard.tsx`)

Show the field in the card if relevant:
```tsx
<span className="text-sm text-slate-500">{project.newField}</span>
```

### 5. Update Detail View (`src/components/ProjectDetail.tsx`)

Show the field in the detail view:
```tsx
<div className="mb-4">
  <h3 className="font-semibold text-slate-700">새 필드</h3>
  <p className="text-slate-600">{project.newField}</p>
</div>
```

### 6. Update AI Generation (if AI should generate it)

In `src/services/geminiService.ts`, update the schema:
```tsx
responseSchema: {
  type: Type.OBJECT,
  properties: {
    // ... existing
    newField: { type: Type.STRING },
  },
  required: ["shortDescription", "description", "tags", "newField"]
}
```

## Platform Types
When adding new platform types, update `ProjectPlatform`:
```tsx
export type ProjectPlatform = 'WEB' | 'APP' | 'GAME' | 'DESIGN' | 'OTHER' | 'NEW_TYPE'
```
