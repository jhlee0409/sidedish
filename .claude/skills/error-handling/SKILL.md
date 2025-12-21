---
name: error-handling
description: 일관된 에러 처리와 로깅 패턴을 구현합니다. API 에러 응답, 예외 처리, 에러 바운더리, 사용자 친화적 메시지 작성 시 사용하세요. 서버와 클라이언트 양쪽의 에러 처리 전략을 포함합니다.
allowed-tools: Read, Glob, Grep
---

# Error Handling Skill

## Instructions

1. Use consistent HTTP status codes
2. Return Korean error messages to users
3. Log detailed errors server-side only
4. Handle `ApiError` class on client-side

## Status Code Quick Reference

| Code | Use Case | Message |
|------|----------|---------|
| 400 | Invalid input | 입력 정보를 확인해주세요. |
| 401 | Auth required | 인증이 필요합니다. |
| 403 | No permission | 권한이 없습니다. |
| 404 | Not found | 찾을 수 없습니다. |
| 429 | Rate limit | 요청이 너무 많습니다. |
| 500 | Server error | 서버 오류가 발생했습니다. |

## Server-Side Pattern

```typescript
try {
  // logic
} catch (error) {
  console.error('[API] POST /api/endpoint error:', error)
  return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
}
```

For complete patterns (client error handling, toast helpers, retry logic, error messages), see [reference.md](reference.md).
