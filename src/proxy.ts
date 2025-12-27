/**
 * Next.js Proxy - Node.js Runtime
 *
 * Next.js 16+: Middleware → Proxy 마이그레이션
 * - Node.js Runtime에서 실행 (Edge Runtime 미지원)
 * - 네트워크 경계에서 요청 인터셉트 및 수정
 * - 인증 상태 검증 및 보호된 라우트 가드
 * - 보안 헤더 적용
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/proxy
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Protected routes that require authentication
 *
 * 현재: API 레이어에서 인증 체크
 * TODO: Proxy에서 사전 검증 (성능 향상)
 */
const protectedRoutes = [
  '/menu/register',
  '/menu/edit',
  '/mypage',
]

const protectedApiRoutes = [
  '/api/projects',  // POST only
  '/api/upload',
  '/api/ai/generate',
  '/api/promotion',
]

/**
 * Proxy matcher configuration
 *
 * 최적화: 정적 파일은 제외하여 성능 향상
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip proxy for API routes (handled by route handlers)
  // TODO: 향후 API 라우트도 Proxy에서 검증 (rate limiting 등)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const requiresAuth = protectedRoutes.some(route => pathname.startsWith(route))

  if (requiresAuth) {
    // TODO: httpOnly 쿠키에서 인증 토큰 확인
    // 현재: 클라이언트 측 AuthContext에서 처리
    // const authToken = request.cookies.get('auth-token')
    // if (!authToken) {
    //   return NextResponse.redirect(new URL('/login', request.url))
    // }
  }

  // Add security headers (2025 best practice)
  const response = NextResponse.next()

  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )

  return response
}
