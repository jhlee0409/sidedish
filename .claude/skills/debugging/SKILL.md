---
name: debugging
description: Debugs common issues in SideDish. Use when fixing errors, investigating bugs, troubleshooting API failures, or resolving build issues. Includes common error patterns, logging strategies, and debugging tools.
---

# Debugging Skill

## Instructions

1. Check browser console & Network tab
2. Review server logs in terminal
3. Verify environment variables
4. Check Firebase console for auth/db issues
5. Clear cache if needed: `rm -rf .next && pnpm dev`

## Common Error Patterns

### 401 "인증이 필요합니다"
```typescript
const { user, isAuthenticated } = useAuth()
console.log('Auth state:', { user, isAuthenticated })
```
**Fix**: Wrap with `useRequireAuth()`, check Firebase config

### 403 "권한이 없습니다"
```typescript
console.log('authorId:', doc.data()?.authorId)
console.log('user:', authUser.uid)
```
**Fix**: Verify ownership check logic

### 404 "찾을 수 없습니다"
```typescript
const doc = await db.collection('projects').doc(id).get()
console.log('exists:', doc.exists, 'id:', id)
```

### Hydration Errors
```tsx
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null
```

## Quick Checklist
- [ ] Browser console errors
- [ ] Network tab failed requests
- [ ] Environment variables set
- [ ] Firebase console status
- [ ] TypeScript errors (`pnpm build`)
- [ ] Server logs in terminal

For complete debugging templates and TypeScript error fixes, see [reference.md](reference.md).
