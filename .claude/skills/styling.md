# Styling Skill

## When to Use
Use this skill when styling components or adding new UI elements.

## Design System

### Colors
```
Primary:    indigo-600, indigo-700 (buttons, links)
Accent:     orange-500, orange-600 (highlights, CTAs)
Background: #F8FAFC (slate-50)
Text:       slate-900 (heading), slate-600 (body), slate-400 (muted)
Border:     slate-200, slate-100
```

### Typography
- Font: Pretendard (Korean-optimized)
- Headings: `font-bold text-slate-900`
- Body: `text-slate-600`
- Small: `text-sm text-slate-500`

### Spacing
- Container: `container mx-auto px-4 max-w-7xl`
- Section padding: `py-20`, `pb-20`
- Card padding: `p-6`, `p-8`
- Gap: `gap-4`, `gap-6`, `gap-8`

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
```

## Common Patterns

### Glassmorphism Card
```tsx
<div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl shadow-slate-200/50">
  {/* content */}
</div>
```

### Button Variants
```tsx
// Primary (main actions)
className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl font-semibold"

// Secondary
className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-5 py-2.5 rounded-xl font-semibold"

// Outline
className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl font-semibold"

// Ghost
className="text-slate-500 hover:bg-slate-100/50 hover:text-slate-900 px-5 py-2.5 rounded-xl font-semibold"
```

### Input Field
```tsx
<input
  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 hover:border-slate-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder-slate-400"
/>
```

### Tag/Badge
```tsx
<span className="px-3 py-1 bg-slate-100 text-slate-600 text-sm rounded-full">
  태그
</span>
```

### Icon Button
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
```

### Hover Effects
```tsx
// Scale on hover
className="hover:scale-105 transition-transform"

// Lift on hover
className="hover:-translate-y-1 hover:shadow-lg transition-all"
```

### Loading Spinner
```tsx
import { Loader2 } from 'lucide-react'

<Loader2 className="w-5 h-5 animate-spin" />
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
```

## Icons
Using Lucide React. Common icons:
```tsx
import {
  Search, Filter, Plus, X, ArrowLeft,
  Heart, MessageCircle, Share2, ExternalLink,
  ChefHat, Utensils, Star, TrendingUp,
  Loader2, Check, AlertCircle
} from 'lucide-react'

<Icon className="w-5 h-5" />
```
