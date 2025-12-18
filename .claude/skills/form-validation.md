---
name: validating-forms-with-zod
description: Validates forms using React Hook Form and Zod. Use when creating forms with validation, handling form state, showing error messages, or implementing multi-step forms. Includes schema patterns and Controller usage.
---

# Form Validation Skill

## When to Use
- Creating forms with client-side validation
- Implementing real-time validation feedback
- Building multi-step forms
- Handling complex form state
- Integrating with API submissions

## Setup

### Required Imports
```typescript
import { useForm, Controller, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
```

## Schema Patterns

### Basic Schema
```typescript
const schema = z.object({
  name: z.string().min(2, '2자 이상 입력해주세요.').max(20, '20자 이하로 입력해주세요.'),
  email: z.string().email('유효한 이메일을 입력해주세요.'),
  age: z.number().min(1).max(120),
})

type FormData = z.infer<typeof schema>
```

### Korean Validation Messages (Zod 4.x)
```typescript
const schema = z.object({
  // Required field - Zod 4.x에서는 min(1)로 필수 처리
  title: z.string()
    .min(1, '제목을 입력해주세요.'),

  // Length validation
  description: z.string()
    .min(10, '최소 10자 이상 입력해주세요.')
    .max(1000, '최대 1000자까지 입력 가능합니다.'),

  // URL validation
  link: z.string()
    .url('유효한 URL을 입력해주세요.')
    .optional()
    .or(z.literal('')),

  // Email validation
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),

  // Custom regex
  nickname: z.string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '한글, 영문, 숫자, 밑줄만 사용 가능합니다.'),

  // Checkbox (must be true) - Zod 4.x
  termsAccepted: z.literal(true, '약관에 동의해주세요.'),

  // Select/Enum - Zod 4.x에서는 message 옵션 사용
  platform: z.enum(['WEB', 'APP', 'GAME', 'DESIGN', 'OTHER'], {
    message: '플랫폼을 선택해주세요.',
  }),

  // Array with min/max
  tags: z.array(z.string())
    .min(1, '최소 1개의 태그가 필요합니다.')
    .max(5, '태그는 최대 5개까지 가능합니다.'),
})
```

### Optional Fields
```typescript
const schema = z.object({
  // Optional string
  githubUrl: z.string().url().optional().or(z.literal('')),

  // Optional with default
  isPublic: z.boolean().default(true),

  // Nullable
  bio: z.string().nullable(),
})
```

### Conditional Validation
```typescript
const schema = z.object({
  hasWebsite: z.boolean(),
  websiteUrl: z.string().optional(),
}).refine(
  (data) => !data.hasWebsite || (data.hasWebsite && data.websiteUrl),
  {
    message: '웹사이트가 있다면 URL을 입력해주세요.',
    path: ['websiteUrl'],
  }
)
```

## Form Hook Usage

### Basic Setup
```typescript
const {
  control,
  handleSubmit,
  formState: { errors, isValid, isSubmitting, isDirty },
  reset,
  setValue,
  watch,
} = useForm<FormData>({
  resolver: zodResolver(schema),
  mode: 'onChange',  // Validate on change
  defaultValues: {
    name: '',
    email: '',
  },
})
```

### Mode Options
```typescript
mode: 'onChange'    // Validate on every change (recommended)
mode: 'onBlur'      // Validate when field loses focus
mode: 'onSubmit'    // Validate only on submit
mode: 'onTouched'   // Validate on first blur, then on change
mode: 'all'         // All of the above
```

## Controller Pattern

### Text Input
```typescript
<Controller
  name="title"
  control={control}
  render={({ field, fieldState }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        제목 <span className="text-red-500">*</span>
      </label>
      <input
        {...field}
        className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
          fieldState.error
            ? 'border-red-500 focus:ring-red-500/20'
            : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20'
        } focus:ring-4 outline-none`}
        placeholder="프로젝트 제목을 입력하세요"
      />
      {fieldState.error && (
        <p className="text-red-500 text-sm">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

### Textarea
```typescript
<Controller
  name="description"
  control={control}
  render={({ field, fieldState }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">설명</label>
      <textarea
        {...field}
        rows={5}
        className={`w-full px-4 py-3 rounded-xl border-2 resize-none ${
          fieldState.error ? 'border-red-500' : 'border-slate-200'
        }`}
        placeholder="프로젝트에 대해 설명해주세요"
      />
      <div className="flex justify-between text-xs text-slate-400">
        {fieldState.error ? (
          <span className="text-red-500">{fieldState.error.message}</span>
        ) : (
          <span>최대 1000자</span>
        )}
        <span>{field.value?.length || 0}/1000</span>
      </div>
    </div>
  )}
/>
```

### Select
```typescript
<Controller
  name="platform"
  control={control}
  render={({ field, fieldState }) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">플랫폼</label>
      <select
        {...field}
        className={`w-full px-4 py-3 rounded-xl border-2 ${
          fieldState.error ? 'border-red-500' : 'border-slate-200'
        }`}
      >
        <option value="">선택하세요</option>
        <option value="WEB">웹</option>
        <option value="APP">앱</option>
        <option value="GAME">게임</option>
      </select>
      {fieldState.error && (
        <p className="text-red-500 text-sm">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

### Checkbox
```typescript
<Controller
  name="termsAccepted"
  control={control}
  render={({ field, fieldState }) => (
    <div className="space-y-1">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={field.value}
          onChange={(e) => field.onChange(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300"
        />
        <span className="text-sm text-slate-600">
          <a href="/terms" className="text-indigo-600 underline">이용약관</a>에 동의합니다
        </span>
      </label>
      {fieldState.error && (
        <p className="text-red-500 text-sm">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

## Form Submission

### Basic Submit
```typescript
const onSubmit = async (data: FormData) => {
  try {
    await createProject(data)
    toast.success('등록되었습니다!')
    reset()
  } catch (error) {
    toast.error('등록에 실패했습니다.')
  }
}

<form onSubmit={handleSubmit(onSubmit)}>
  {/* form fields */}
  <button
    type="submit"
    disabled={!isValid || isSubmitting}
    className="w-full py-3 bg-orange-500 text-white rounded-xl disabled:opacity-50"
  >
    {isSubmitting ? '처리 중...' : '등록하기'}
  </button>
</form>
```

### With Server Errors
```typescript
const onSubmit = async (data: FormData) => {
  try {
    await createProject(data)
  } catch (error) {
    if (error instanceof ApiError) {
      // Set field-specific error from server
      if (error.field) {
        setError(error.field, { message: error.message })
      } else {
        setError('root', { message: error.message })
      }
    }
  }
}

// Display root error
{errors.root && (
  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
    {errors.root.message}
  </div>
)}
```

## Watch Values

### Watch Single Field
```typescript
const title = watch('title')

// Show character count
<span>{title?.length || 0}/100</span>
```

### Watch Multiple Fields
```typescript
const [title, description] = watch(['title', 'description'])
```

### useWatch Hook (Optimized)
```typescript
const title = useWatch({ control, name: 'title' })
```

## Reset Form

```typescript
// Reset to default values
reset()

// Reset to specific values
reset({
  title: 'New Title',
  description: '',
})

// Reset specific field
setValue('title', '')
```

## Multi-Step Forms

```typescript
const [step, setStep] = useState(1)

const schema = z.object({
  // Step 1 fields
  name: z.string().min(2),
  email: z.string().email(),
  // Step 2 fields
  company: z.string().optional(),
  role: z.string().optional(),
})

// Validate only current step fields
const validateStep = async (step: number) => {
  const fieldsToValidate = step === 1 ? ['name', 'email'] : ['company', 'role']
  return await trigger(fieldsToValidate)
}

const handleNext = async () => {
  const isValid = await validateStep(step)
  if (isValid) setStep(step + 1)
}
```

## Zod 4.x Migration Notes

### Breaking Changes from Zod 3.x
```typescript
// ❌ Zod 3.x (deprecated)
z.string({ required_error: '필수입니다.' })
z.enum(['A', 'B'], { errorMap: () => ({ message: '선택하세요.' }) })
z.literal(true, { errorMap: () => ({ message: '동의해주세요.' }) })

// ✅ Zod 4.x
z.string().min(1, '필수입니다.')
z.enum(['A', 'B'], { message: '선택하세요.' })
z.literal(true, '동의해주세요.')
```

### Error Message Patterns
```typescript
// Zod 4.x - 간단한 에러 메시지
z.string().min(1, '에러 메시지')
z.enum(['A', 'B'], { message: '에러 메시지' })
z.number().min(0, { message: '0 이상이어야 합니다.' })

// Zod 4.x - 커스텀 에러 함수 (동적 메시지)
z.string().min(5, (val) => `최소 5자 필요 (현재: ${val.input?.length || 0}자)`)
```

## Limitations
- Schema changes require form re-mount
- Large forms may have performance impact with `mode: 'onChange'`
- Complex conditional validation may need custom refinements
- Zod 4.x requires updated error message syntax (see Migration Notes)
