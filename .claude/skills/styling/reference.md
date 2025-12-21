# Styling Reference

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
- Headings: `font-bold text-slate-900`
- Body: `text-slate-600`
- Small: `text-sm text-slate-500`
- Muted: `text-slate-400`

### Spacing
- Container: `container mx-auto px-4 max-w-7xl`
- Section: `py-20`
- Card: `p-6`, `p-8`
- Gap: `gap-4`, `gap-6`

### Border Radius
- Small: `rounded-lg` (8px)
- Medium: `rounded-xl` (12px)
- Large: `rounded-2xl` (16px)
- XL: `rounded-[2rem]`
- Full: `rounded-full`

## Button Variants

```tsx
// Primary
className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-semibold transition-colors"

// Accent (CTA)
className="bg-orange-500 text-white hover:bg-orange-600 px-5 py-2.5 rounded-xl font-semibold transition-colors"

// Secondary
className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-semibold transition-colors"

// Outline
className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl"

// Ghost
className="text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 px-5 py-2.5 rounded-xl"

// Danger
className="bg-red-500 text-white hover:bg-red-600 px-5 py-2.5 rounded-xl"

// Disabled
className="... disabled:opacity-50 disabled:cursor-not-allowed"

// With Loading
<button disabled={isLoading} className="flex items-center gap-2">
  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> 처리 중...</> : '저장하기'}
</button>
```

## Card Patterns

### Glassmorphism
```tsx
<div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
```

### Solid
```tsx
<div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-100">
```

### Gradient
```tsx
<div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl p-6 text-white">
```

## Form Elements

### Input
```tsx
<input className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all" />
```

### Input with Error
```tsx
<input className={`... ${error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200'}`} />
```

### Textarea
```tsx
<textarea className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 resize-none" rows={4} />
```

## Tags & Badges

```tsx
// Tag
<span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">태그</span>

// Badge
<span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">NEW</span>
```

## Animations

### Entry Animations
```tsx
className="animate-in fade-in slide-in-from-bottom-4 duration-500"
className="animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200"
className="animate-in zoom-in-95 duration-300"
```

### Hover Effects
```tsx
className="hover:scale-105 transition-transform"
className="hover:-translate-y-1 hover:shadow-lg transition-all"
```

### Loading
```tsx
<Loader2 className="w-5 h-5 animate-spin" />
<div className="animate-pulse bg-slate-200 rounded-xl h-40" />
```

## Modal

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
  <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
    {/* content */}
  </div>
</div>
```

## Responsive

```tsx
// Grid
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"

// Hide/Show
className="hidden md:block"  // Hidden mobile, visible md+
className="md:hidden"        // Visible mobile, hidden md+
```

## Icons (Lucide React)

```tsx
import { Search, Plus, X, Heart, Edit, Trash2, Loader2, ChefHat } from 'lucide-react'

<Icon className="w-4 h-4" />  // Small
<Icon className="w-5 h-5" />  // Default
<Icon className="w-6 h-6" />  // Large
```
