---
name: creating-react-components
description: Creates React components for SideDish. Use when adding new UI components, modals, forms, or interactive elements. Includes TypeScript interfaces, styling patterns, and security considerations.
---

# Create Component Skill

## When to Use
- Creating new UI components (buttons, cards, modals)
- Adding forms with validation
- Building interactive elements with React hooks
- Implementing client-side components with `'use client'`

## File Location
Create components in `src/components/ComponentName.tsx`

## Component Template

### Basic Interactive Component
```tsx
'use client'

import { useState } from 'react'

interface ComponentNameProps {
  title: string
  onClick?: () => void
  children?: React.ReactNode
}

const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  onClick,
  children
}) => {
  const [isLoading, setIsLoading] = useState(false)

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      {children}
    </div>
  )
}

export default ComponentName
```

### Form Component with Validation
```tsx
'use client'

import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, '2자 이상 입력해주세요.').max(20),
  email: z.string().email('유효한 이메일을 입력해주세요.'),
})

type FormData = z.infer<typeof schema>

interface FormComponentProps {
  onSubmit: (data: FormData) => Promise<void>
  onCancel?: () => void
}

const FormComponent: React.FC<FormComponentProps> = ({ onSubmit, onCancel }) => {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
  })

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState }) => (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              {...field}
              className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                fieldState.error
                  ? 'border-red-500 focus:ring-red-500/20'
                  : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20'
              } focus:ring-4`}
              placeholder="이름을 입력하세요"
            />
            {fieldState.error && (
              <p className="text-red-500 text-sm mt-1">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />

      <div className="flex gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              처리 중...
            </>
          ) : (
            '저장하기'
          )}
        </button>
      </div>
    </form>
  )
}

export default FormComponent
```

### Modal Component
```tsx
'use client'

import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
```

## Conventions

1. **`'use client'`** - Required for interactive components with hooks
2. **Props Interface** - Define above the component with explicit types
3. **`React.FC<Props>`** - Use this pattern for type-safe components
4. **Default Export** - Always export as default
5. **Path Alias** - Use `@/` for imports from `src/`

## Import Pattern
```tsx
// External libraries
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

// Icons
import { Loader2, X, Check, AlertTriangle } from 'lucide-react'

// Internal utilities
import { useAuth } from '@/contexts/AuthContext'
import { sanitizePlainText } from '@/lib/sanitize-utils'

// Internal components
import Button from '@/components/Button'
import SafeMarkdown from '@/components/SafeMarkdown'
```

## Styling Guidelines

- Use Tailwind CSS classes
- Follow design system colors:
  - Primary: `indigo-600`, `indigo-700`
  - Accent: `orange-500`, `orange-600`
  - Neutral: `slate-50` to `slate-900`
- Glassmorphism: `bg-white/70 backdrop-blur-xl`
- Large border radius: `rounded-xl`, `rounded-2xl`
- Animations: `animate-in fade-in slide-in-from-bottom-*`

## Korean Text

All user-facing text should be in Korean:
- Button: "등록하기", "취소", "저장하기", "삭제"
- Labels: "제목", "설명", "태그", "이름"
- Errors: "오류가 발생했습니다", "필수 항목입니다"
- Success: "저장되었습니다", "등록되었습니다"

## Security Considerations

When handling user input:
```tsx
import { sanitizePlainText } from '@/lib/sanitize-utils'
import SafeMarkdown from '@/components/SafeMarkdown'

// For plain text input
const safeContent = sanitizePlainText(userInput)

// For markdown content
<SafeMarkdown>{description}</SafeMarkdown>
```

## Existing Components Reference

| Component | Purpose |
|-----------|---------|
| `Layout.tsx` | App wrapper with header |
| `Dashboard.tsx` | Project gallery |
| `ProjectCard.tsx` | Project card in grid |
| `SafeMarkdown.tsx` | XSS-safe markdown |
| `LoginModal.tsx` | Auth modal |
| `SignupProfileForm.tsx` | User profile setup |
| `ProfileEditModal.tsx` | Profile editing |
| `WithdrawalModal.tsx` | Account withdrawal |
| `ConfirmModal.tsx` | Confirmation dialog |
| `Button.tsx` | Reusable button |
