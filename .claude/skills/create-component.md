# Create Component Skill

## When to Use
Use this skill when creating new React components for SideDish.

## Instructions

### File Location
Create components in `src/components/ComponentName.tsx`

### Component Template
```tsx
'use client'

import { useState } from 'react'

interface ComponentNameProps {
  // Define props here
}

const ComponentName: React.FC<ComponentNameProps> = ({ }) => {
  return (
    <div>
      {/* Component content */}
    </div>
  )
}

export default ComponentName
```

### Conventions
1. Use `'use client'` directive for interactive components
2. Define props interface above the component
3. Use `React.FC<Props>` pattern
4. Export as default
5. Use `@/` path alias for imports

### Styling Guidelines
- Use Tailwind CSS classes
- Follow design system colors:
  - Primary: `indigo-600`, `indigo-700`
  - Accent: `orange-500`, `orange-600`
  - Neutral: `slate-50` to `slate-900`
- Use glassmorphism: `bg-white/70 backdrop-blur-xl`
- Large border radius: `rounded-xl`, `rounded-2xl`
- Animations: `animate-in fade-in slide-in-from-bottom-*`

### Korean Text
All user-facing text should be in Korean. Examples:
- Button: "등록하기", "취소", "저장"
- Labels: "프로젝트 이름", "설명", "태그"
- Errors: "오류가 발생했습니다"
