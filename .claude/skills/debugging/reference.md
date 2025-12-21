# Debugging Reference

## Common Error Patterns

### 1. "인증이 필요합니다" (401)

**Debug**:
```typescript
const { user, isAuthenticated } = useAuth()
console.log('Auth state:', { user, isAuthenticated })

const token = await getIdToken()
console.log('Token exists:', !!token)

const authUser = await verifyAuth(request)
console.log('Auth user:', authUser)
```

**Fixes**:
- Wrap protected pages with `useRequireAuth()`
- Check `AuthContext` initialization
- Verify Firebase config in `.env.local`

### 2. "권한이 없습니다" (403)

**Debug**:
```typescript
console.log('Document authorId:', doc.data()?.authorId)
console.log('Current user:', authUser.uid)
console.log('Match:', doc.data()?.authorId === authUser.uid)
```

### 3. "찾을 수 없습니다" (404)

**Debug**:
```typescript
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
console.log('Document exists:', doc.exists)
console.log('Document ID:', id)
```

### 4. Hydration Errors

**Cause**: Date formatting, random IDs, localStorage in SSR

**Fix**:
```typescript
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])
if (!mounted) return null

// Or dynamic import
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### 5. Firebase Connection Errors

**Debug**:
```typescript
try {
  const db = getAdminDb()
  console.log('Firebase connected')
} catch (error) {
  console.error('Firebase init error:', error)
}
```

**Fixes**:
- Verify `FIREBASE_ADMIN_PRIVATE_KEY` preserves newlines
- Check project ID matches Firebase console

### 6. Rate Limit Errors (429)

**Debug**:
```typescript
const result = checkRateLimit(clientIp, config)
console.log('Rate limit:', result)
// { allowed: false, remaining: 0, resetMs: 45000 }
```

## Logging Strategies

### Client-Side
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}
```

### Server-Side
```typescript
console.log('[API] POST /api/projects - Start')
console.log('[API] Request body:', JSON.stringify(body).slice(0, 200))
console.error('[API] POST /api/projects - Error:', error)
```

## API Debugging Template

```typescript
export async function POST(request: NextRequest) {
  const debugId = `debug_${Date.now()}`

  try {
    console.log(`[${debugId}] Incoming request`)

    let body
    try {
      body = await request.json()
      console.log(`[${debugId}] Body:`, JSON.stringify(body).slice(0, 500))
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    const authUser = await verifyAuth(request)
    console.log(`[${debugId}] Auth:`, authUser ? authUser.uid : 'none')

    // ... logic

    console.log(`[${debugId}] Success`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(`[${debugId}] Error:`, error)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
```

## TypeScript Errors

### "Type 'X' is not assignable"
```typescript
const data: ExpectedType = receivedData  // See exact mismatch
```

### "Property does not exist"
```typescript
const value = obj?.property?.nested

if ('property' in obj) {
  console.log(obj.property)
}
```

### "Cannot find module '@/...'"
Check `tsconfig.json`:
```json
{ "compilerOptions": { "paths": { "@/*": ["./src/*"] } } }
```

## Build Errors

### "Module not found"
```bash
rm -rf node_modules .next
pnpm install && pnpm dev
```

### "Prerender error"
Add `'use client'` or use dynamic import

### ESLint errors
```bash
pnpm lint --fix
```

## Debug Tools

- **Network Tab**: Track API requests
- **React DevTools**: Check state/props
- **Firebase Console**: Monitor auth/db
