import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { Timestamp } from 'firebase-admin/firestore'
import {
  DigestDoc,
  DigestSubscriptionDoc,
  UpdateSubscriptionRequest,
  toDigestResponse,
  toSubscriptionResponse,
} from '@/lib/digest-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/digests/subscriptions/[id] - 구독 상세 조회
 * 인증 필요 (본인 구독만)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const subDoc = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .doc(id)
      .get()

    if (!subDoc.exists) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const subData = subDoc.data() as DigestSubscriptionDoc

    // 본인 구독인지 확인
    if (subData.userId !== user.uid) {
      return forbiddenResponse()
    }

    // 다이제스트 정보 조회
    const digestDoc = await db
      .collection(COLLECTIONS.DIGESTS)
      .doc(subData.digestId)
      .get()

    if (!digestDoc.exists) {
      return NextResponse.json(
        { error: '다이제스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const digestData = digestDoc.data() as DigestDoc

    return NextResponse.json(
      toSubscriptionResponse(
        subData,
        toDigestResponse(digestData, { isSubscribed: true, subscriptionId: id })
      )
    )
  } catch (error) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json(
      { error: '구독 정보를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/digests/subscriptions/[id] - 구독 설정 수정
 * 인증 필요 (본인 구독만)
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const subRef = db.collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS).doc(id)
    const subDoc = await subRef.get()

    if (!subDoc.exists) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const subData = subDoc.data() as DigestSubscriptionDoc

    // 본인 구독인지 확인
    if (subData.userId !== user.uid) {
      return forbiddenResponse()
    }

    const body: UpdateSubscriptionRequest = await request.json()

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    }

    if (body.settings !== undefined) {
      updateData.settings = {
        ...subData.settings,
        ...body.settings,
      }
    }

    if (body.isActive !== undefined) {
      updateData.isActive = body.isActive
    }

    await subRef.update(updateData)

    // 업데이트된 구독 반환
    const updatedDoc = await subRef.get()
    const updatedData = updatedDoc.data() as DigestSubscriptionDoc

    // 다이제스트 정보 조회
    const digestDoc = await db
      .collection(COLLECTIONS.DIGESTS)
      .doc(subData.digestId)
      .get()

    const digestData = digestDoc.data() as DigestDoc

    return NextResponse.json(
      toSubscriptionResponse(
        updatedData,
        toDigestResponse(digestData, { isSubscribed: true, subscriptionId: id })
      )
    )
  } catch (error) {
    console.error('Error updating subscription:', error)
    return NextResponse.json(
      { error: '구독 설정 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/digests/subscriptions/[id] - 구독 해제
 * 인증 필요 (본인 구독만)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const subRef = db.collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS).doc(id)
    const subDoc = await subRef.get()

    if (!subDoc.exists) {
      return NextResponse.json(
        { error: '구독 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const subData = subDoc.data() as DigestSubscriptionDoc

    // 본인 구독인지 확인
    if (subData.userId !== user.uid) {
      return forbiddenResponse()
    }

    // 구독 비활성화 (soft delete)
    await subRef.update({
      isActive: false,
      updatedAt: Timestamp.now(),
    })

    return NextResponse.json({ message: '구독이 해제되었습니다.' })
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json(
      { error: '구독 해제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
