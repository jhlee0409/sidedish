---
name: styling-with-tailwind
description: Styles components using Tailwind CSS 4 and SideDish design system. Use when adding styles, buttons, forms, cards, animations, or responsive layouts. Includes color palette, spacing, and glassmorphism patterns.
---

# Styling Skill

## When to Use
- Styling new or existing components
- Creating buttons, forms, cards, modals
- Adding animations and transitions
- Implementing responsive layouts
- Using the SideDish design system

## Design System

### Colors
```
Primary:    indigo-600, indigo-700  (buttons, links)
Accent:     orange-500, orange-600  (highlights, CTAs)
Success:    emerald-500, emerald-600
Warning:    amber-500, amber-600
Error:      red-500, red-600
Background: #F8FAFC (slate-50)
Text:       slate-900 (heading), slate-600 (body), slate-400 (muted)
Border:     slate-200, slate-100
```

### Typography
- Font: System default (Pretendard for Korean)
- Headings: `font-bold text-slate-900`
- Body: `text-slate-600`
- Small: `text-sm text-slate-500`
- Muted: `text-slate-400`

### Spacing
- Container: `container mx-auto px-4 max-w-7xl`
- Section padding: `py-20`, `pb-20`
- Card padding: `p-6`, `p-8`
- Gap: `gap-4`, `gap-6`, `gap-8`
- Space between: `space-y-4`, `space-y-6`

### Border Radius
```
Small:   rounded-lg (8px)
Medium:  rounded-xl (12px)
Large:   rounded-2xl (16px)
XL:      rounded-[2rem], rounded-[2.5rem]
Full:    rounded-full (pills, avatars)
```

### Shadows
```
Small:   shadow-sm
Medium:  shadow-md
Large:   shadow-xl shadow-slate-200/50
XL:      shadow-2xl
```

## Common Patterns

### Glassmorphism Card
```tsx
<div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
  {/* content */}
</div>
```

### Solid Card
```tsx
<div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
  {/* content */}
</div>
```

### Gradient Card
```tsx
<div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
  {/* content */}
</div>
```

## Button Variants

### Primary (main actions)
```tsx
className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Accent (CTA)
```tsx
className="bg-orange-500 text-white hover:bg-orange-600 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Secondary
```tsx
className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Outline
```tsx
className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Ghost
```tsx
className="text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Danger
```tsx
className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-xl font-semibold transition-colors"
```

### Disabled State
```tsx
className="... disabled:opacity-50 disabled:cursor-not-allowed"
```

### With Loading
```tsx
import { Loader2 } from 'lucide-react'

<button disabled={isLoading} className="... flex items-center justify-center gap-2">
  {isLoading ? (
    <>
      <Loader2 className="w-5 h-5 animate-spin" />
      처리 중...
    </>
  ) : (
    '저장하기'
  )}
</button>
```

## Form Elements

### Input Field
```tsx
<input
  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder-slate-400 outline-none"
/>
```

### Input with Error
```tsx
<input
  className={`w-full px-4 py-3 rounded-xl border-2 transition-all outline-none ${
    error
      ? 'border-red-500 focus:ring-red-500/20'
      : 'border-slate-200 focus:border-orange-500 focus:ring-orange-500/20'
  } focus:ring-4`}
/>
{error && <p className="text-red-500 text-sm mt-1">{error}</p>}
```

### Textarea
```tsx
<textarea
  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all resize-none outline-none"
  rows={4}
/>
```

### Select
```tsx
<select className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none bg-white">
  <option value="">선택하세요</option>
</select>
```

### Checkbox
```tsx
<label className="flex items-center gap-3 cursor-pointer">
  <div className="relative">
    <input type="checkbox" className="peer sr-only" />
    <div className="w-5 h-5 border-2 border-slate-300 rounded peer-checked:border-orange-500 peer-checked:bg-orange-500 transition-all flex items-center justify-center">
      <Check className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" />
    </div>
  </div>
  <span className="text-sm text-slate-600">라벨 텍스트</span>
</label>
```

### Radio
```tsx
<label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
  <input type="radio" className="sr-only peer" />
  <div className="w-4 h-4 rounded-full border-2 border-slate-300 peer-checked:border-orange-500 flex items-center justify-center">
    <div className="w-2 h-2 bg-orange-500 rounded-full opacity-0 peer-checked:opacity-100" />
  </div>
  <span className="text-sm text-slate-700">옵션</span>
</label>
```

## Tags & Badges

### Tag
```tsx
<span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
  태그
</span>
```

### Badge
```tsx
<span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
  NEW
</span>
```

### Platform Badge
```tsx
<span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-sm font-medium rounded-full">
  WEB
</span>
```

## Icon Button
```tsx
<button className="p-2 rounded-full hover:bg-slate-100 transition-colors">
  <Icon className="w-5 h-5 text-slate-500" />
</button>
```

## Animations

### Entry Animations (defined in globals.css)
```tsx
// Fade in with slide up
className="animate-in fade-in slide-in-from-bottom-4 duration-500"

// With delay
className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"

// Zoom in
className="animate-in zoom-in-95 duration-300"
```

### Hover Effects
```tsx
// Scale on hover
className="hover:scale-105 transition-transform"

// Lift on hover
className="hover:-translate-y-1 hover:shadow-lg transition-all"

// Color change
className="hover:bg-slate-100 transition-colors"
```

### Loading Spinner
```tsx
import { Loader2 } from 'lucide-react'

<Loader2 className="w-5 h-5 animate-spin" />
```

### Pulse Animation
```tsx
<div className="animate-pulse bg-slate-200 rounded-xl h-40" />
```

## Modal & Overlay

### Modal Container
```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  {/* Backdrop */}
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

  {/* Modal */}
  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95 duration-300">
    {/* content */}
  </div>
</div>
```

### Toast / Notification
Using Sonner library:
```tsx
import { toast } from 'sonner'

toast.success('저장되었습니다!')
toast.error('오류가 발생했습니다.')
toast.info('알림 메시지')
```

## Responsive Design
```
Mobile first approach:
- Default: mobile styles
- sm: 640px+
- md: 768px+
- lg: 1024px+
- xl: 1280px+

Grid example:
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

Hide/Show:
className="hidden md:block"  // Hidden on mobile, visible on md+
className="md:hidden"        // Visible on mobile, hidden on md+
```

## Icons
Using Lucide React. Common icons:
```tsx
import {
  // Navigation
  Search, Filter, Plus, X, ArrowLeft, ArrowRight,
  ChevronDown, ChevronUp, ChevronLeft, ChevronRight,

  // Actions
  Heart, MessageCircle, Share2, ExternalLink,
  Edit, Trash2, Copy, Download, Upload,

  // Status
  Check, AlertCircle, AlertTriangle, Info,
  Loader2,

  // Theme
  ChefHat, Utensils, Star, TrendingUp,

  // User
  User, LogOut, Settings, Camera,
} from 'lucide-react'

// Icon sizing
<Icon className="w-4 h-4" />  // Small
<Icon className="w-5 h-5" />  // Default
<Icon className="w-6 h-6" />  // Large
<Icon className="w-8 h-8" />  // XL
```

## Dark Mode (준비중)
현재 라이트 모드만 지원. 다크 모드 추가 시:
```tsx
className="bg-white dark:bg-slate-900"
className="text-slate-900 dark:text-white"
```
