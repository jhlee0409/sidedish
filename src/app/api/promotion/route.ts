/**
 * Promotion API Route
 *
 * SIM 워크플로우를 호출하여 소셜 미디어(LinkedIn, X, Threads, Facebook)에
 * 프로젝트 홍보 게시글을 자동으로 발행합니다.
 *
 * @see https://docs.sim.ai/triggers/api
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { validateString, validateUrl } from '@/lib/security-utils'
import {
  checkRateLimit,
  rateLimitResponse,
  getClientIdentifier,
  createRateLimitKey,
} from '@/lib/rate-limiter'
import { getPageUrl } from '@/lib/site'

// Rate limit config for promotion (limited to prevent spam)
const PROMOTION_RATE_LIMIT = {
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5, // 5 promotions per hour
  keyPrefix: 'promotion',
}

// Available social media platforms
export type SocialPlatform = 'x' | 'linkedin' | 'facebook' | 'threads'

const VALID_PLATFORMS: SocialPlatform[] = ['x', 'linkedin', 'facebook', 'threads']

interface PromotionRequest {
  projectId: string
  projectTitle: string
  projectSummary: string
  projectTags: string[]
  projectUrl?: string
  platforms?: SocialPlatform[]
}

interface SimWorkflowResponse {
  success: boolean
  executionId?: string
  results?: {
    linkedin?: { success: boolean; postId?: string; error?: string }
    x?: { success: boolean; tweetId?: string; error?: string }
    threads?: { success: boolean; postId?: string; error?: string }
    facebook?: { success: boolean; postId?: string; error?: string }
  }
  error?: string
}

/**
 * POST /api/promotion
 *
 * 프로젝트를 소셜 미디어에 홍보합니다.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication check
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // 2. Rate limiting
    const clientIp = getClientIdentifier(request)
    const rateLimitKey = createRateLimitKey(user.uid, clientIp)
    const { allowed, remaining, resetMs } = checkRateLimit(
      rateLimitKey,
      PROMOTION_RATE_LIMIT
    )

    if (!allowed) {
      return rateLimitResponse(
        remaining,
        resetMs,
        '홍보 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }

    // 3. Check environment variables
    const simApiKey = process.env.SIM_API_KEY
    const simWorkflowId = process.env.SIM_WORKFLOW_ID

    if (!simApiKey || !simWorkflowId) {
      console.error('SIM configuration missing: SIM_API_KEY or SIM_WORKFLOW_ID')
      return NextResponse.json(
        { error: '홍보 서비스가 설정되지 않았습니다.', code: 'SERVICE_UNAVAILABLE' },
        { status: 503 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json() as PromotionRequest

    // Validate required fields
    const titleValidation = validateString(body.projectTitle, 'projectTitle', {
      required: true,
      minLength: 1,
      maxLength: 100,
    })
    if (!titleValidation.valid) {
      return NextResponse.json(
        { error: titleValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    const summaryValidation = validateString(body.projectSummary, 'projectSummary', {
      required: true,
      minLength: 10,
      maxLength: 500,
    })
    if (!summaryValidation.valid) {
      return NextResponse.json(
        { error: summaryValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // Validate project ID
    const projectIdValidation = validateString(body.projectId, 'projectId', {
      required: true,
      minLength: 1,
      maxLength: 100,
    })
    if (!projectIdValidation.valid) {
      return NextResponse.json(
        { error: projectIdValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // Generate project URL if not provided
    const projectUrl = body.projectUrl || getPageUrl(`/menu/${body.projectId}`)

    // Validate URL format
    const urlValidation = validateUrl(projectUrl, 'projectUrl')
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error, code: 'INVALID_INPUT' },
        { status: 400 }
      )
    }

    // Format tags as comma-separated string
    const tagsString = Array.isArray(body.projectTags)
      ? body.projectTags.slice(0, 5).join(', ')
      : ''

    // Validate and filter platforms
    let platforms: SocialPlatform[] = VALID_PLATFORMS // Default: all platforms
    if (body.platforms && Array.isArray(body.platforms)) {
      platforms = body.platforms.filter((p): p is SocialPlatform =>
        VALID_PLATFORMS.includes(p as SocialPlatform)
      )
      if (platforms.length === 0) {
        return NextResponse.json(
          { error: '최소 하나의 플랫폼을 선택해주세요.', code: 'INVALID_INPUT' },
          { status: 400 }
        )
      }
    }

    // 5. Call SIM workflow
    const simEndpoint = `https://sim.ai/api/workflows/${simWorkflowId}/execute`

    const simResponse = await fetch(simEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': simApiKey,
      },
      body: JSON.stringify({
        projectTitle: body.projectTitle,
        projectSummary: body.projectSummary,
        projectTags: tagsString,
        projectUrl: projectUrl,
        platforms: platforms,
      }),
    })

    if (!simResponse.ok) {
      const errorText = await simResponse.text()
      console.error('SIM API error:', simResponse.status, errorText)

      // Handle specific error cases
      if (simResponse.status === 401 || simResponse.status === 403) {
        return NextResponse.json(
          { error: '홍보 서비스 인증에 실패했습니다.', code: 'SIM_AUTH_ERROR' },
          { status: 503 }
        )
      }

      if (simResponse.status === 429) {
        return NextResponse.json(
          { error: '홍보 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', code: 'SIM_RATE_LIMIT' },
          { status: 429 }
        )
      }

      return NextResponse.json(
        { error: '홍보 처리 중 오류가 발생했습니다.', code: 'SIM_ERROR' },
        { status: 500 }
      )
    }

    const simResult = await simResponse.json() as SimWorkflowResponse

    // 6. Return success response
    return NextResponse.json({
      success: true,
      message: '홍보 게시글이 발행되었습니다.',
      executionId: simResult.executionId,
      results: simResult.results,
    })

  } catch (error) {
    console.error('Promotion API error:', error)

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.', code: 'INVALID_JSON' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: '홍보 처리 중 오류가 발생했습니다.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
