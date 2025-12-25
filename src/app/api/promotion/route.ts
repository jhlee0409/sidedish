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
import { getAdminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Rate limit config for promotion (limited to prevent spam)
const PROMOTION_RATE_LIMIT = {
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  maxRequests: 3, // 3 promotions per day
  keyPrefix: 'promotion',
}

// Project-level cooldown (7 days between re-promotions)
const PROJECT_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

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

/**
 * SIM workflow response format (updated 2025.01)
 * Returns post URLs for each platform
 */
interface SimWorkflowResponse {
  success: boolean
  posts?: {
    x?: string | null
    linkedin?: string | null
    facebook?: string | null
    threads?: string | null
  }
  error?: string
}

/**
 * Promotion posts stored in project document
 */
export interface PromotionPosts {
  x?: string | null
  linkedin?: string | null
  facebook?: string | null
  threads?: string | null
  promotedAt: string
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

    // 5. Check project-level cooldown (7 days between re-promotions)
    const db = getAdminDb()
    const projectDoc = await db.collection('projects').doc(body.projectId).get()

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.', code: 'PROJECT_NOT_FOUND' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()
    if (projectData?.promotionPosts?.promotedAt) {
      const lastPromotedAt = new Date(projectData.promotionPosts.promotedAt).getTime()
      const timeSinceLastPromotion = Date.now() - lastPromotedAt

      if (timeSinceLastPromotion < PROJECT_COOLDOWN_MS) {
        const remainingDays = Math.ceil((PROJECT_COOLDOWN_MS - timeSinceLastPromotion) / (24 * 60 * 60 * 1000))
        return NextResponse.json(
          {
            error: `이 프로젝트는 ${remainingDays}일 후에 다시 홍보할 수 있습니다.`,
            code: 'PROJECT_COOLDOWN',
            remainingDays,
          },
          { status: 429 }
        )
      }
    }

    // 6. Call SIM workflow
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

      // Try to parse error details from SIM response
      let simErrorMessage: string | undefined
      try {
        const simError = JSON.parse(errorText)
        simErrorMessage = simError.error || simError.message
      } catch {
        // Response wasn't JSON, use raw text if short enough
        if (errorText && errorText.length < 200) {
          simErrorMessage = errorText
        }
      }

      // Handle specific error cases
      if (simResponse.status === 401 || simResponse.status === 403) {
        return NextResponse.json(
          { error: '홍보 서비스 인증에 실패했습니다.', code: 'SIM_AUTH_ERROR' },
          { status: 503 }
        )
      }

      if (simResponse.status === 404) {
        console.error('SIM workflow not found. Check SIM_WORKFLOW_ID configuration.')
        return NextResponse.json(
          { error: '홍보 워크플로우를 찾을 수 없습니다. 관리자에게 문의해주세요.', code: 'SIM_WORKFLOW_NOT_FOUND' },
          { status: 503 }
        )
      }

      if (simResponse.status === 400) {
        return NextResponse.json(
          {
            error: simErrorMessage || '홍보 요청 형식이 올바르지 않습니다.',
            code: 'SIM_BAD_REQUEST'
          },
          { status: 400 }
        )
      }

      if (simResponse.status === 429) {
        return NextResponse.json(
          { error: '홍보 서비스 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.', code: 'SIM_RATE_LIMIT' },
          { status: 429 }
        )
      }

      // Generic error with status code for debugging
      return NextResponse.json(
        {
          error: '홍보 처리 중 오류가 발생했습니다.',
          code: 'SIM_ERROR',
          details: process.env.NODE_ENV === 'development'
            ? { status: simResponse.status, message: simErrorMessage }
            : undefined
        },
        { status: 500 }
      )
    }

    const simResult = await simResponse.json() as SimWorkflowResponse

    // 7. Save promotion results to project document
    if (simResult.success && simResult.posts) {
      try {
        const promotionPosts: PromotionPosts = {
          ...simResult.posts,
          promotedAt: new Date().toISOString(),
        }

        await db.collection('projects').doc(body.projectId).update({
          promotionPosts,
          updatedAt: FieldValue.serverTimestamp(),
        })
      } catch (dbError) {
        // Log but don't fail the request if saving fails
        console.error('Failed to save promotion results to project:', dbError)
      }
    }

    // 8. Return success response with post URLs
    return NextResponse.json({
      success: simResult.success,
      message: simResult.success
        ? '홍보 게시글이 발행되었습니다.'
        : '일부 플랫폼에 홍보하지 못했습니다.',
      posts: simResult.posts,
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
