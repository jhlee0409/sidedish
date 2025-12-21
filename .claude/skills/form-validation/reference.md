# Form Validation Reference

## Schema Patterns

### Korean Validation Messages (Zod 4.x)
```typescript
const schema = z.object({
  // Required field
  title: z.string().min(1, '제목을 입력해주세요.'),

  // Length validation
  description: z.string()
    .min(10, '최소 10자 이상 입력해주세요.')
    .max(1000, '최대 1000자까지 입력 가능합니다.'),

  // URL validation
  link: z.string().url('유효한 URL을 입력해주세요.').optional().or(z.literal('')),

  // Email
  email: z.string().email('유효한 이메일 형식이 아닙니다.'),

  // Custom regex
  nickname: z.string()
    .min(2, '닉네임은 2자 이상이어야 합니다.')
    .max(20, '닉네임은 20자 이하여야 합니다.')
    .regex(/^[가-힣a-zA-Z0-9_]+$/, '한글, 영문, 숫자, 밑줄만 사용 가능합니다.'),

  // Checkbox (must be true)
  termsAccepted: z.literal(true, '약관에 동의해주세요.'),

  // Select/Enum
  platform: z.enum(['WEB', 'APP', 'GAME', 'DESIGN', 'OTHER'], {
    message: '플랫폼을 선택해주세요.',
  }),

  // Array with limits
  tags: z.array(z.string())
    .min(1, '최소 1개의 태그가 필요합니다.')
    .max(5, '태그는 최대 5개까지 가능합니다.'),
})
```

### Conditional Validation
```typescript
const schema = z.object({
  hasWebsite: z.boolean(),
  websiteUrl: z.string().optional(),
}).refine(
  (data) => !data.hasWebsite || data.websiteUrl,
  { message: '웹사이트가 있다면 URL을 입력해주세요.', path: ['websiteUrl'] }
)
```

## Controller Components

### Text Input
```tsx
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
        className={`w-full px-4 py-3 rounded-xl border-2 ${
          fieldState.error ? 'border-red-500' : 'border-slate-200 focus:border-orange-500'
        } focus:ring-4`}
        placeholder="프로젝트 제목을 입력하세요"
      />
      {fieldState.error && (
        <p className="text-red-500 text-sm">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

### Textarea with Character Count
```tsx
<Controller
  name="description"
  control={control}
  render={({ field, fieldState }) => (
    <div className="space-y-1">
      <label>설명</label>
      <textarea {...field} rows={5} />
      <div className="flex justify-between text-xs text-slate-400">
        {fieldState.error ? (
          <span className="text-red-500">{fieldState.error.message}</span>
        ) : <span>최대 1000자</span>}
        <span>{field.value?.length || 0}/1000</span>
      </div>
    </div>
  )}
/>
```

### Select
```tsx
<Controller
  name="platform"
  control={control}
  render={({ field, fieldState }) => (
    <select {...field}>
      <option value="">선택하세요</option>
      <option value="WEB">웹</option>
      <option value="APP">앱</option>
    </select>
  )}
/>
```

### Checkbox
```tsx
<Controller
  name="termsAccepted"
  control={control}
  render={({ field, fieldState }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={field.value}
        onChange={(e) => field.onChange(e.target.checked)}
      />
      <span>이용약관에 동의합니다</span>
    </label>
  )}
/>
```

## Form Submission

```tsx
const onSubmit = async (data: FormData) => {
  try {
    await createProject(data)
    toast.success('등록되었습니다!')
    reset()
  } catch (error) {
    if (error instanceof ApiError && error.details) {
      Object.entries(error.details).forEach(([field, message]) => {
        setError(field as keyof FormData, { message })
      })
    } else {
      setError('root', { message: '오류가 발생했습니다.' })
    }
  }
}

<button type="submit" disabled={!isValid || isSubmitting}>
  {isSubmitting ? '처리 중...' : '등록하기'}
</button>
```

## Mode Options
```typescript
mode: 'onChange'    // Recommended: validate on every change
mode: 'onBlur'      // Validate when field loses focus
mode: 'onSubmit'    // Validate only on submit
```

## Zod 4.x Migration Notes

```typescript
// ❌ Zod 3.x (deprecated)
z.string({ required_error: '필수입니다.' })
z.enum(['A', 'B'], { errorMap: () => ({ message: '선택하세요.' }) })

// ✅ Zod 4.x
z.string().min(1, '필수입니다.')
z.enum(['A', 'B'], { message: '선택하세요.' })
z.literal(true, '동의해주세요.')
```
