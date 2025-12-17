import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { GoogleGenAI, Type } from "@google/genai"
import { Timestamp } from 'firebase-admin/firestore'
import {
  checkRateLimit,
  rateLimitResponse,
  RATE_LIMIT_CONFIGS,
  getClientIdentifier,
  createRateLimitKey,
} from '@/lib/rate-limiter'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const MODEL = 'gemini-2.5-flash-lite'

// Type for AI-generated project content
interface GeneratedProjectContent {
  shortDescription: string
  description: string
  tags: string[]
}

// Limits configuration
const LIMITS = {
  MAX_PER_DRAFT: 3,
  MAX_PER_DAY: 10,
  COOLDOWN_MS: 5000,
  MIN_DESCRIPTION_LENGTH: 30,
}

// Get today's date string in YYYY-MM-DD format
const getTodayString = (): string => {
  return new Date().toISOString().split('T')[0]
}

interface AiUsageDoc {
  usageByDraft: {
    [draftId: string]: {
      count: number
      lastGeneratedAt: Timestamp
    }
  }
  dailyUsage: {
    [date: string]: {
      count: number
      lastGeneratedAt: Timestamp
    }
  }
}

// POST /api/ai/generate - Generate project content with AI (requires auth)
export async function POST(request: NextRequest) {
  try {
    // 1. Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // 1.5. Rate limiting (additional layer on top of Firestore-based limits)
    const clientIp = getClientIdentifier(request)
    const rateLimitKey = createRateLimitKey(user.uid, clientIp)
    const rateLimit = checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIGS.AI_GENERATE)

    if (!rateLimit.allowed) {
      return rateLimitResponse(
        rateLimit.remaining,
        rateLimit.resetMs,
        'AI 생성 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
      )
    }

    const db = getAdminDb()
    const body = await request.json()
    const { draftId, description } = body

    // 2. Validate input
    if (!draftId || typeof draftId !== 'string') {
      return NextResponse.json(
        { error: 'draftId가 필요합니다.' },
        { status: 400 }
      )
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: '설명 내용이 필요합니다.' },
        { status: 400 }
      )
    }

    if (description.trim().length < LIMITS.MIN_DESCRIPTION_LENGTH) {
      return NextResponse.json(
        { error: `최소 ${LIMITS.MIN_DESCRIPTION_LENGTH}자 이상의 설명을 입력해주세요.` },
        { status: 400 }
      )
    }

    // 3. Check and reserve usage atomically using Firestore transaction
    // This prevents race conditions where multiple requests could bypass limits
    const usageRef = db.collection(COLLECTIONS.AI_USAGE).doc(user.uid)
    const today = getTodayString()
    const now = Timestamp.now()
    const nowMs = now.toMillis()

    interface TransactionResult {
      success: boolean
      error?: string
      code?: string
      newDraftCount?: number
      newDailyCount?: number
      cooldownRemaining?: number
      remainingForDraft?: number
      remainingForDay?: number
    }

    const transactionResult = await db.runTransaction<TransactionResult>(async (transaction) => {
      const usageDoc = await transaction.get(usageRef)
      const usageData = usageDoc.data() as AiUsageDoc | undefined

      const draftUsage = usageData?.usageByDraft?.[draftId]
      const dailyUsage = usageData?.dailyUsage?.[today]

      // Check draft limit
      if (draftUsage && draftUsage.count >= LIMITS.MAX_PER_DRAFT) {
        return {
          success: false,
          error: `이 프로젝트는 이미 ${LIMITS.MAX_PER_DRAFT}번 AI 생성을 사용했습니다.`,
          code: 'DRAFT_LIMIT_EXCEEDED',
          remainingForDraft: 0,
          remainingForDay: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
        }
      }

      // Check daily limit
      if (dailyUsage && dailyUsage.count >= LIMITS.MAX_PER_DAY) {
        return {
          success: false,
          error: `오늘의 AI 생성 한도(${LIMITS.MAX_PER_DAY}회)를 모두 사용했습니다.`,
          code: 'DAILY_LIMIT_EXCEEDED',
          remainingForDraft: LIMITS.MAX_PER_DRAFT - (draftUsage?.count || 0),
          remainingForDay: 0,
        }
      }

      // Check cooldown
      const lastGeneratedAt = Math.max(
        draftUsage?.lastGeneratedAt?.toMillis() || 0,
        dailyUsage?.lastGeneratedAt?.toMillis() || 0
      )
      const cooldownRemaining = Math.max(0, Math.ceil((LIMITS.COOLDOWN_MS - (nowMs - lastGeneratedAt)) / 1000))

      if (cooldownRemaining > 0) {
        return {
          success: false,
          error: `잠시만 기다려주세요. ${cooldownRemaining}초 후에 다시 시도할 수 있습니다.`,
          code: 'COOLDOWN_ACTIVE',
          cooldownRemaining,
          remainingForDraft: LIMITS.MAX_PER_DRAFT - (draftUsage?.count || 0),
          remainingForDay: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
        }
      }

      // Reserve the slot by incrementing counts atomically
      const newDraftCount = (draftUsage?.count || 0) + 1
      const newDailyCount = (dailyUsage?.count || 0) + 1

      transaction.set(usageRef, {
        usageByDraft: {
          ...usageData?.usageByDraft,
          [draftId]: {
            count: newDraftCount,
            lastGeneratedAt: now,
          }
        },
        dailyUsage: {
          [today]: {
            count: newDailyCount,
            lastGeneratedAt: now,
          }
        },
        updatedAt: now,
      }, { merge: true })

      return {
        success: true,
        newDraftCount,
        newDailyCount,
      }
    })

    // Handle rate limit errors
    if (!transactionResult.success) {
      return NextResponse.json(
        {
          error: transactionResult.error,
          code: transactionResult.code,
          cooldownRemaining: transactionResult.cooldownRemaining,
          remainingForDraft: transactionResult.remainingForDraft,
          remainingForDay: transactionResult.remainingForDay,
        },
        { status: 429 }
      )
    }

    const { newDraftCount, newDailyCount } = transactionResult

    // 4. Generate content with Gemini
    const prompt = `
<system_role>
당신은 사이드 프로젝트 큐레이션 플랫폼 'SideDish'의 전문 에디터입니다.
당신의 역할은 투박한 프로젝트 초안을 '먹음직스러운 메뉴(매력적인 서비스 설명)'로 플레이팅하는 것입니다.
</system_role>

<style_guide>
1. **톤앤매너**:
   - '해요체'를 사용하여 정중하면서도 위트 있게 작성하세요.
   - 전문 용어보다는 일반 사용자 입장에서의 효용(Benefit)을 강조하세요.
   - 과도한 이모지 남발은 지양하고, 가독성을 높이는 용도로만 사용하세요.
2. **금지사항**:
   - 입력 데이터에 없는 사실을 지어내지 마세요.
   - "최고의", "혁신적인" 같은 상투적인 수식어를 남발하지 마세요.
</style_guide>

<response_format>
결과는 반드시 아래의 JSON 스키마를 준수해야 합니다. 마크다운 코드 블록 없이 Raw JSON만 출력하세요.

{
  "shortDescription": "최대 80자. 호기심을 자극하는 한 문장 카피.",
  "description": "마크다운 문자열. 아래 구조 필수:\n• 🍽️ **한 줄 요약**: [문제 해결 중심 요약]\n\n• 🧑‍🍳 **주요 기능**:\n  - [핵심 기능 1]\n  - [핵심 기능 2]\n\n• ✨ **매력 포인트**: [차별점 1가지]",
  "tags": ["태그1", "태그2", "태그3", "태그4"] // 최대 5개, 기술 스택 제외, 용도/장르 위주
}
</response_format>

<few_shot_example>
User Input:
"제목: 냥이 집사
내용: 고양이 화장실 청소 주기를 기록하는 앱입니다. 리액트로 만들었고 화장실 모래 전체 갈이 알림도 줍니다. 여러 마리 등록 가능해요."

AI Output:
{
  "shortDescription": "집사님들의 쾌적한 반려생활을 위한 고양이 화장실 청소 & 모래 교체 관리 매니저",
  "description": "• 🍽️ **한 줄 요약**: 깜빡하기 쉬운 고양이 화장실 청소와 모래 교체 주기를 놓치지 않도록 도와주는 집사 필수 앱입니다.\n\n• 🧑‍🍳 **주요 기능**:\n  - 감자 캐는 날과 전체 갈이 날짜를 간편하게 기록\n  - 위생적인 환경을 위한 맞춤형 알림 발송\n  - 다묘 가정을 위한 고양이별 개별 프로필 관리\n\n• ✨ **매력 포인트**: 더 이상 달력에 표시하지 않아도, 우리 냥이의 화장실 위생을 완벽하게 챙길 수 있어요.",
  "tags": ["반려동물", "생산성", "기록", "생활", "건강"]
}
</few_shot_example>

<task>
아래 제공된 [Input Project Draft]를 바탕으로 3가지 마케팅 요소를 JSON으로 생성하세요.
</task>

[Input Project Draft]
${description}
`

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            shortDescription: { type: Type.STRING },
            description: { type: Type.STRING },
            tags: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["shortDescription", "description", "tags"]
        }
      }
    })

    if (!response.text) {
      throw new Error("AI returned empty response")
    }

    const result: GeneratedProjectContent = JSON.parse(response.text)

    // 5. Return result with usage info (already updated atomically in transaction)
    return NextResponse.json({
      ...result,
      generatedAt: nowMs,
      usage: {
        remainingForDraft: LIMITS.MAX_PER_DRAFT - newDraftCount!,
        remainingForDay: LIMITS.MAX_PER_DAY - newDailyCount!,
        maxPerDraft: LIMITS.MAX_PER_DRAFT,
        maxPerDay: LIMITS.MAX_PER_DAY,
      }
    })

  } catch (error) {
    console.error('AI Generate Error:', error)
    return NextResponse.json(
      { error: 'AI 콘텐츠 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/ai/generate - Get current usage info (requires auth)
export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const draftId = searchParams.get('draftId')

    if (!draftId) {
      return NextResponse.json(
        { error: 'draftId가 필요합니다.' },
        { status: 400 }
      )
    }

    const usageRef = db.collection(COLLECTIONS.AI_USAGE).doc(user.uid)
    const usageDoc = await usageRef.get()
    const usageData = usageDoc.data() as AiUsageDoc | undefined

    const today = getTodayString()
    const draftUsage = usageData?.usageByDraft?.[draftId]
    const dailyUsage = usageData?.dailyUsage?.[today]

    return NextResponse.json({
      remainingForDraft: LIMITS.MAX_PER_DRAFT - (draftUsage?.count || 0),
      remainingForDay: LIMITS.MAX_PER_DAY - (dailyUsage?.count || 0),
      maxPerDraft: LIMITS.MAX_PER_DRAFT,
      maxPerDay: LIMITS.MAX_PER_DAY,
      cooldownMs: LIMITS.COOLDOWN_MS,
    })

  } catch (error) {
    console.error('Get AI Usage Error:', error)
    return NextResponse.json(
      { error: '사용량 정보를 가져오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
