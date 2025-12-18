import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { Timestamp } from 'firebase-admin/firestore'
import {
  DigestDoc,
  DigestResponse,
  CreateDigestRequest,
  toDigestResponse,
} from '@/lib/digest-types'

/**
 * GET /api/digests - 다이제스트 목록 조회
 * 인증 불필요 (공개 API)
 */
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const { searchParams } = new URL(request.url)

    // 현재 유저 확인 (구독 여부 표시용)
    const user = await verifyAuth(request)

    // 활성 다이제스트만 조회 (기본)
    const activeOnly = searchParams.get('activeOnly') !== 'false'
    const category = searchParams.get('category')

    let query = db.collection(COLLECTIONS.DIGESTS).orderBy('createdAt', 'desc')

    if (activeOnly) {
      query = query.where('isActive', '==', true)
    }

    const snapshot = await query.get()
    const digests: DigestResponse[] = []

    // 유저의 구독 목록 조회 (로그인한 경우)
    let userSubscriptions: Map<string, string> = new Map()
    if (user) {
      const subsSnapshot = await db
        .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
        .where('userId', '==', user.uid)
        .where('isActive', '==', true)
        .get()

      subsSnapshot.docs.forEach((doc) => {
        const data = doc.data()
        userSubscriptions.set(data.digestId, doc.id)
      })
    }

    for (const doc of snapshot.docs) {
      const data = doc.data() as DigestDoc

      // 카테고리 필터
      if (category && data.category !== category) {
        continue
      }

      // 구독자 수 조회
      const subsCount = await db
        .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
        .where('digestId', '==', doc.id)
        .where('isActive', '==', true)
        .count()
        .get()

      digests.push(
        toDigestResponse(data, {
          subscriberCount: subsCount.data().count,
          isSubscribed: userSubscriptions.has(doc.id),
          subscriptionId: userSubscriptions.get(doc.id),
        })
      )
    }

    return NextResponse.json({ data: digests })
  } catch (error) {
    console.error('Error fetching digests:', error)
    return NextResponse.json(
      { error: '다이제스트 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/digests - 다이제스트 생성
 * 관리자 전용 (TODO: Admin 권한 체크 추가)
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // TODO: Admin 권한 체크 (Firebase Custom Claims)
    // 현재는 로그인한 사용자만 허용 (개발용)

    const body: CreateDigestRequest = await request.json()

    // 필수 필드 검증
    if (!body.name || !body.slug || !body.description || !body.icon || !body.category) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // slug 중복 체크
    const db = getAdminDb()
    const existing = await db
      .collection(COLLECTIONS.DIGESTS)
      .where('slug', '==', body.slug)
      .get()

    if (!existing.empty) {
      return NextResponse.json(
        { error: '이미 사용 중인 슬러그입니다.' },
        { status: 400 }
      )
    }

    // 다이제스트 생성
    const now = Timestamp.now()
    const docRef = db.collection(COLLECTIONS.DIGESTS).doc()

    const digestData: DigestDoc = {
      id: docRef.id,
      name: body.name,
      slug: body.slug,
      description: body.description,
      icon: body.icon,
      category: body.category,
      isActive: true,
      isPremium: body.isPremium || false,
      config: {
        deliveryTime: body.config?.deliveryTime || '07:00',
        cities: body.config?.cities,
      },
      createdAt: now,
      updatedAt: now,
    }

    await docRef.set(digestData)

    return NextResponse.json(toDigestResponse(digestData), { status: 201 })
  } catch (error) {
    console.error('Error creating digest:', error)
    return NextResponse.json(
      { error: '다이제스트 생성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
