/**
 * API 헬퍼 함수
 * API 라우트에서 사용하는 공통 유틸리티 함수 모음
 */

import { NextResponse } from 'next/server'

/**
 * API 에러를 일관된 형식으로 처리
 * @param error - 발생한 에러
 * @param context - 에러 컨텍스트 (로깅용, 예: "GET /api/projects")
 * @param userMessage - 사용자에게 보여줄 메시지
 * @param status - HTTP 상태 코드 (기본값: 500)
 * @returns NextResponse with error JSON
 *
 * @example
 * ```ts
 * // API 라우트에서 사용
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... 로직 ...
 *     return NextResponse.json(response)
 *   } catch (error) {
 *     return handleApiError(
 *       error,
 *       'GET /api/projects',
 *       '프로젝트 목록을 불러오는데 실패했습니다.'
 *     )
 *   }
 * }
 * ```
 *
 * @remarks
 * - 개발 환경: 상세 에러 메시지 포함 (디버깅용)
 * - 프로덕션 환경: 사용자 친화적 메시지만 반환 (보안)
 */
export function handleApiError(
  error: unknown,
  context: string,
  userMessage: string,
  status: number = 500
): NextResponse {
  // 에러 로깅 (서버 콘솔)
  console.error(`[API Error] ${context}:`, error)

  // 에러 메시지 추출
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'

  // 응답 구성
  const response: {
    error: string
    details?: string
  } = {
    error: userMessage,
  }

  // 개발 환경에서만 세부 에러 정보 포함
  if (process.env.NODE_ENV === 'development') {
    response.details = errorMessage
  }

  return NextResponse.json(response, { status })
}

/**
 * 성공 응답 헬퍼
 * @param data - 응답 데이터
 * @param status - HTTP 상태 코드 (기본값: 200)
 * @returns NextResponse with success data
 *
 * @example
 * ```ts
 * return successResponse({ projects: [...] })
 * return successResponse({ id: '123' }, 201) // Created
 * ```
 */
export function successResponse<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

/**
 * Bad Request 응답 헬퍼 (400)
 * @param message - 에러 메시지
 * @returns NextResponse with 400 status
 *
 * @example
 * ```ts
 * if (!title) return badRequestResponse('제목은 필수입니다.')
 * ```
 */
export function badRequestResponse(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Unauthorized 응답 헬퍼 (401)
 * @param message - 에러 메시지 (기본값: '로그인이 필요합니다.')
 * @returns NextResponse with 401 status
 *
 * @example
 * ```ts
 * if (!userId) return unauthorizedResponse()
 * ```
 */
export function unauthorizedResponse(
  message: string = '로그인이 필요합니다.'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Forbidden 응답 헬퍼 (403)
 * @param message - 에러 메시지 (기본값: '권한이 없습니다.')
 * @returns NextResponse with 403 status
 *
 * @example
 * ```ts
 * if (userId !== project.authorId) return forbiddenResponse()
 * ```
 */
export function forbiddenResponse(
  message: string = '권한이 없습니다.'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Not Found 응답 헬퍼 (404)
 * @param message - 에러 메시지 (기본값: '요청한 리소스를 찾을 수 없습니다.')
 * @returns NextResponse with 404 status
 *
 * @example
 * ```ts
 * if (!project.exists) return notFoundResponse('프로젝트를 찾을 수 없습니다.')
 * ```
 */
export function notFoundResponse(
  message: string = '요청한 리소스를 찾을 수 없습니다.'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 404 })
}

/**
 * Rate Limit 응답 헬퍼 (429)
 * @param remaining - 남은 요청 횟수
 * @param resetMs - 리셋까지 남은 밀리초
 * @returns NextResponse with 429 status and rate limit headers
 *
 * @example
 * ```ts
 * const { allowed, remaining, resetMs } = checkRateLimit(key, config)
 * if (!allowed) return rateLimitResponse(remaining, resetMs)
 * ```
 */
export function rateLimitResponse(remaining: number, resetMs: number): NextResponse {
  return NextResponse.json(
    {
      error: '요청 횟수 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
      remaining,
      resetIn: Math.ceil(resetMs / 1000), // seconds
    },
    {
      status: 429,
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': new Date(Date.now() + resetMs).toISOString(),
      },
    }
  )
}

/**
 * Internal Server Error 응답 헬퍼 (500)
 * @param message - 에러 메시지 (기본값: '서버 오류가 발생했습니다.')
 * @returns NextResponse with 500 status
 *
 * @example
 * ```ts
 * return internalServerErrorResponse('데이터베이스 연결 실패')
 * ```
 */
export function internalServerErrorResponse(
  message: string = '서버 오류가 발생했습니다.'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 500 })
}
