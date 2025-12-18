import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { Timestamp } from 'firebase-admin/firestore'
import {
  DigestDoc,
  DigestSubscriptionDoc,
  CreateSubscriptionRequest,
  toDigestResponse,
  toSubscriptionResponse,
  MAX_SUBSCRIPTIONS,
} from '@/lib/digest-types'

/**
 * GET /api/digests/subscriptions - 내 구독 목록 조회
 * 인증 필요
 */
export async function GET(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()

    // 내 구독 목록 조회
    const subsSnapshot = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('userId', '==', user.uid)
      .where('isActive', '==', true)
      .orderBy('createdAt', 'desc')
      .get()

    const subscriptions = []

    for (const subDoc of subsSnapshot.docs) {
      const subData = subDoc.data() as DigestSubscriptionDoc

      // 다이제스트 정보 조회
      const digestDoc = await db
        .collection(COLLECTIONS.DIGESTS)
        .doc(subData.digestId)
        .get()

      if (!digestDoc.exists) continue

      const digestData = digestDoc.data() as DigestDoc

      subscriptions.push(
        toSubscriptionResponse(
          subData,
          toDigestResponse(digestData, { isSubscribed: true })
        )
      )
    }

    return NextResponse.json({
      data: subscriptions,
      count: subscriptions.length,
      max: MAX_SUBSCRIPTIONS,
    })
  } catch (error) {
    console.error('Error fetching subscriptions:', error)
    return NextResponse.json(
      { error: '구독 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/digests/subscriptions - 다이제스트 구독
 * 인증 필요
 */
export async function POST(request: NextRequest) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    if (!user.email) {
      return NextResponse.json(
        { error: '이메일 정보가 필요합니다.' },
        { status: 400 }
      )
    }

    const body: CreateSubscriptionRequest = await request.json()

    if (!body.digestId) {
      return NextResponse.json(
        { error: '다이제스트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const db = getAdminDb()

    // 다이제스트 존재 여부 확인
    const digestDoc = await db
      .collection(COLLECTIONS.DIGESTS)
      .doc(body.digestId)
      .get()

    if (!digestDoc.exists) {
      return NextResponse.json(
        { error: '다이제스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const digestData = digestDoc.data() as DigestDoc

    if (!digestData.isActive) {
      return NextResponse.json(
        { error: '현재 이용할 수 없는 다이제스트입니다.' },
        { status: 400 }
      )
    }

    // 이미 구독 중인지 확인
    const existingSub = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('userId', '==', user.uid)
      .where('digestId', '==', body.digestId)
      .where('isActive', '==', true)
      .limit(1)
      .get()

    if (!existingSub.empty) {
      return NextResponse.json(
        { error: '이미 구독 중인 도시락입니다.' },
        { status: 400 }
      )
    }

    // 최대 구독 수 확인
    const subsCount = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('userId', '==', user.uid)
      .where('isActive', '==', true)
      .count()
      .get()

    if (subsCount.data().count >= MAX_SUBSCRIPTIONS) {
      return NextResponse.json(
        { error: `최대 ${MAX_SUBSCRIPTIONS}개까지 구독할 수 있습니다.` },
        { status: 400 }
      )
    }

    // 구독 생성
    const now = Timestamp.now()
    const subRef = db.collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS).doc()

    const subscriptionData: DigestSubscriptionDoc = {
      id: subRef.id,
      userId: user.uid,
      userEmail: user.email,
      digestId: body.digestId,
      settings: body.settings || {},
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }

    await subRef.set(subscriptionData)

    return NextResponse.json(
      toSubscriptionResponse(
        subscriptionData,
        toDigestResponse(digestData, { isSubscribed: true, subscriptionId: subRef.id })
      ),
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating subscription:', error)
    return NextResponse.json(
      { error: '구독에 실패했습니다.' },
      { status: 500 }
    )
  }
}
