# Create Component Reference

## Form Component Template

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
              className={`w-full px-4 py-3 rounded-xl border-2 ${
                fieldState.error ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
              }`}
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
          <button type="button" onClick={onCancel} className="flex-1 py-3 border border-slate-200 rounded-xl">
            취소
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid || isSubmitting}
          className="flex-1 py-3 bg-orange-500 text-white rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /> 처리 중...</> : '저장하기'}
        </button>
      </div>
    </form>
  )
}

export default FormComponent
```

## Modal Component Template

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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">{title}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

export default Modal
```

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

## Conventions

1. `'use client'` - Required for hooks/interactivity
2. Props interface above component
3. `React.FC<Props>` pattern
4. Default export
5. `@/` path alias for `src/`

## Styling
- Primary: `indigo-600`
- Accent: `orange-500`
- Border radius: `rounded-xl`, `rounded-2xl`
- Glassmorphism: `bg-white/70 backdrop-blur-xl`

## Security

```tsx
import { sanitizePlainText } from '@/lib/sanitize-utils'
import SafeMarkdown from '@/components/SafeMarkdown'

// Plain text
const safeContent = sanitizePlainText(userInput)

// Markdown
<SafeMarkdown>{description}</SafeMarkdown>
```

## Existing Components

| Component | Purpose |
|-----------|---------|
| Layout.tsx | App wrapper with header |
| Dashboard.tsx | Project gallery |
| ProjectCard.tsx | Project card |
| SafeMarkdown.tsx | XSS-safe markdown |
| LoginModal.tsx | Auth modal |
| ConfirmModal.tsx | Confirmation dialog |
| Button.tsx | Reusable button |
