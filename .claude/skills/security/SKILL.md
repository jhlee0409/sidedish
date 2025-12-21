---
name: security
description: Implements security features following OWASP guidelines. Use when validating input, preventing XSS, adding rate limiting, verifying auth, or handling file uploads. Includes security-utils, sanitize-utils, and rate-limiter patterns.
---

# Security Skill

## Instructions

1. **Validate** all input with `security-utils.ts`
2. **Sanitize** user content with `SafeMarkdown` or `sanitizePlainText`
3. **Rate limit** all API endpoints
4. **Verify auth** for protected routes
5. **Check ownership** for write operations

## Quick Reference

```typescript
// Input validation
import { validateString, CONTENT_LIMITS } from '@/lib/security-utils'
const result = validateString(input, 'fieldName', { required: true, maxLength: 100 })

// XSS prevention
import SafeMarkdown from '@/components/SafeMarkdown'
<SafeMarkdown>{userContent}</SafeMarkdown>

// Rate limiting
import { checkRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/rate-limiter'
const { allowed } = checkRateLimit(clientId, RATE_LIMIT_CONFIGS.AUTHENTICATED_WRITE)

// Auth
import { verifyAuth } from '@/lib/auth-utils'
const authUser = await verifyAuth(request)
```

For complete validation patterns, file upload security, and OWASP coverage, see [reference.md](reference.md).
