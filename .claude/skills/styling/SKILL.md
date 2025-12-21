---
name: styling
description: Styles components using Tailwind CSS 4 and SideDish design system. Use when adding styles, buttons, forms, cards, animations, or responsive layouts. Includes color palette, spacing, and glassmorphism patterns.
---

# Styling Skill

## Instructions

1. Use Tailwind CSS classes (no inline styles)
2. Follow SideDish design system colors
3. Use large border radius (`rounded-xl`, `rounded-2xl`)
4. Apply glassmorphism for cards (`bg-white/70 backdrop-blur-xl`)

## Design System

### Colors
- Primary: `indigo-600`, `indigo-700`
- Accent: `orange-500`, `orange-600`
- Text: `slate-900` (heading), `slate-600` (body)
- Background: `slate-50`

### Button Variants
```tsx
// Primary
className="bg-indigo-600 text-white hover:bg-indigo-700 px-5 py-2.5 rounded-xl"

// Accent (CTA)
className="bg-orange-500 text-white hover:bg-orange-600 px-5 py-2.5 rounded-xl"

// Outline
className="border border-slate-200 text-slate-700 hover:bg-slate-50 px-5 py-2.5 rounded-xl"
```

### Glassmorphism Card
```tsx
<div className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-2xl p-6 shadow-xl">
```

For complete component styles, animations, and responsive patterns, see [reference.md](reference.md).
