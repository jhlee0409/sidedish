---
name: debugging-sidedish
description: Debugs common issues in SideDish. Use when fixing errors, investigating bugs, troubleshooting API failures, or resolving build issues. Includes common error patterns, logging strategies, and debugging tools.
---

# Debugging Skill

## When to Use
- Investigating runtime errors
- Fixing API endpoint failures
- Resolving build and TypeScript errors
- Troubleshooting authentication issues
- Debugging Firebase operations

## Common Error Patterns

### 1. "인증이 필요합니다" (401 Unauthorized)

**Cause**: Missing or invalid Firebase auth token

**Debug Steps**:
```typescript
// 1. Check if user is logged in
const { user, isAuthenticated } = useAuth()
console.log('Auth state:', { user, isAuthenticated })

// 2. Check token in API client
const token = await getIdToken()
console.log('Token exists:', !!token)

// 3. Verify token on server
const authUser = await verifyAuth(request)
console.log('Auth user:', authUser)
```

**Common Fixes**:
- Wrap protected pages with `useRequireAuth()`
- Check `AuthContext` is properly initialized
- Verify Firebase config in `.env.local`

### 2. "권한이 없습니다" (403 Forbidden)

**Cause**: User doesn't own the resource

**Debug**:
```typescript
// Check ownership
console.log('Document authorId:', doc.data()?.authorId)
console.log('Current user:', authUser.uid)
console.log('Match:', doc.data()?.authorId === authUser.uid)
```

### 3. "찾을 수 없습니다" (404 Not Found)

**Cause**: Document doesn't exist in Firestore

**Debug**:
```typescript
const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
console.log('Document exists:', doc.exists)
console.log('Document ID:', id)
console.log('Document data:', doc.data())
```

### 4. Hydration Errors

**Symptom**: "Text content did not match"

**Common Causes**:
- Date formatting differences
- Random IDs generated on render
- localStorage access during SSR

**Fix**:
```typescript
// Use useEffect for client-only code
const [mounted, setMounted] = useState(false)
useEffect(() => setMounted(true), [])

if (!mounted) return null // or skeleton

// Or use dynamic import
const Component = dynamic(() => import('./Component'), { ssr: false })
```

### 5. Firebase Connection Errors

**Debug**:
```typescript
// Check Firebase initialization
import { getAdminDb } from '@/lib/firebase-admin'

try {
  const db = getAdminDb()
  console.log('Firebase connected')
} catch (error) {
  console.error('Firebase init error:', error)
}
```

**Common Fixes**:
- Verify `FIREBASE_ADMIN_PRIVATE_KEY` has newlines preserved
- Check project ID matches Firebase console
- Ensure service account has correct permissions

### 6. Rate Limit Errors (429)

**Debug**:
```typescript
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'

const clientIp = getClientIdentifier(request)
const result = checkRateLimit(clientIp, config)
console.log('Rate limit:', result)
// { allowed: false, remaining: 0, resetMs: 45000 }
```

**Fix**: Wait for `resetMs` or reduce request frequency

## Logging Strategies

### Client-Side Logging
```typescript
// Development only logging
if (process.env.NODE_ENV === 'development') {
  console.log('Debug:', data)
}

// Structured logging
console.log(JSON.stringify({
  event: 'api_call',
  endpoint: '/api/projects',
  userId: user?.uid,
  timestamp: new Date().toISOString(),
}, null, 2))
```

### Server-Side Logging
```typescript
// In API routes
export async function POST(request: NextRequest) {
  console.log('[API] POST /api/projects - Start')

  try {
    const body = await request.json()
    console.log('[API] Request body:', JSON.stringify(body).slice(0, 200))

    // ... logic

    console.log('[API] POST /api/projects - Success')
    return NextResponse.json(data)
  } catch (error) {
    console.error('[API] POST /api/projects - Error:', error)
    throw error
  }
}
```

### Error Boundary
```typescript
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught:', error, errorInfo)
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center">
          <h2>문제가 발생했습니다</h2>
          <p className="text-red-500">{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            새로고침
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
```

## Debug Tools

### Network Tab
```typescript
// Add request ID for tracking
const requestId = `req_${Date.now()}`
console.log(`[${requestId}] Starting request`)

// Add to headers
fetch(url, {
  headers: { 'X-Request-ID': requestId }
})
```

### React DevTools
- Check component state and props
- Profile render performance
- Inspect context values

### Firebase Console
- Check Firestore data directly
- Monitor authentication state
- View function logs

## TypeScript Errors

### "Type 'X' is not assignable to type 'Y'"

**Debug**:
```typescript
// Add explicit type to see what's expected
const data: ExpectedType = receivedData
// Error will show exact type mismatch
```

### "Property 'X' does not exist on type 'Y'"

**Fix**:
```typescript
// Add optional chaining
const value = obj?.property?.nested

// Or type guard
if ('property' in obj) {
  console.log(obj.property)
}
```

### "Cannot find module '@/...'"

**Check**:
1. `tsconfig.json` has path alias:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```
2. File exists at expected path
3. Extension is correct (.ts, .tsx)

## Build Errors

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm dev
```

### "Prerender error"
- Usually means server component accessing client-only API
- Add `'use client'` directive or use dynamic import

### "ESLint errors during build"
```bash
# Check errors
pnpm lint

# Fix auto-fixable issues
pnpm lint --fix
```

## API Debugging Template

```typescript
export async function POST(request: NextRequest) {
  const debugId = `debug_${Date.now()}`

  try {
    // Log incoming request
    console.log(`[${debugId}] Incoming request`)
    console.log(`[${debugId}] Headers:`, Object.fromEntries(request.headers))

    // Parse body safely
    let body
    try {
      body = await request.json()
      console.log(`[${debugId}] Body:`, JSON.stringify(body).slice(0, 500))
    } catch (e) {
      console.error(`[${debugId}] Invalid JSON body`)
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Auth check with logging
    const authUser = await verifyAuth(request)
    console.log(`[${debugId}] Auth:`, authUser ? authUser.uid : 'none')

    if (!authUser) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })
    }

    // Database operation with logging
    const db = getAdminDb()
    console.log(`[${debugId}] Firebase connected`)

    // ... your logic

    console.log(`[${debugId}] Success`)
    return NextResponse.json({ success: true })

  } catch (error) {
    console.error(`[${debugId}] Error:`, error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
```

## Quick Checklist

- [ ] Check browser console for errors
- [ ] Check Network tab for failed requests
- [ ] Verify environment variables are set
- [ ] Check Firebase console for auth/db issues
- [ ] Review recent code changes
- [ ] Clear cache (`rm -rf .next && pnpm dev`)
- [ ] Check TypeScript errors (`pnpm build`)
- [ ] Review server logs in terminal

## Limitations
- Server-side logs only visible in terminal (not browser)
- Firebase Admin SDK errors may be cryptic
- Rate limiter state resets on server restart
