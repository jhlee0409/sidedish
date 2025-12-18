import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { Timestamp } from 'firebase-admin/firestore'
import {
  DigestDoc,
  UpdateDigestRequest,
  toDigestResponse,
} from '@/lib/digest-types'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/digests/[id] - 다이제스트 상세 조회
 * 인증 불필요 (공개 API)
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const db = getAdminDb()

    // ID 또는 slug로 조회
    let docSnapshot = await db.collection(COLLECTIONS.DIGESTS).doc(id).get()

    // ID로 찾지 못하면 slug로 검색
    if (!docSnapshot.exists) {
      const slugQuery = await db
        .collection(COLLECTIONS.DIGESTS)
        .where('slug', '==', id)
        .limit(1)
        .get()

      if (slugQuery.empty) {
        return NextResponse.json(
          { error: '다이제스트를 찾을 수 없습니다.' },
          { status: 404 }
        )
      }
      docSnapshot = slugQuery.docs[0]
    }

    const data = docSnapshot.data() as DigestDoc

    // 현재 유저 확인 (구독 여부 표시용)
    const user = await verifyAuth(request)
    let isSubscribed = false
    let subscriptionId: string | undefined

    if (user) {
      const subsSnapshot = await db
        .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
        .where('userId', '==', user.uid)
        .where('digestId', '==', docSnapshot.id)
        .where('isActive', '==', true)
        .limit(1)
        .get()

      if (!subsSnapshot.empty) {
        isSubscribed = true
        subscriptionId = subsSnapshot.docs[0].id
      }
    }

    // 구독자 수 조회
    const subsCount = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('digestId', '==', docSnapshot.id)
      .where('isActive', '==', true)
      .count()
      .get()

    return NextResponse.json(
      toDigestResponse(data, {
        subscriberCount: subsCount.data().count,
        isSubscribed,
        subscriptionId,
      })
    )
  } catch (error) {
    console.error('Error fetching digest:', error)
    return NextResponse.json(
      { error: '다이제스트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/digests/[id] - 다이제스트 수정
 * 관리자 전용
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // TODO: Admin 권한 체크

    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.DIGESTS).doc(id)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: '다이제스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const body: UpdateDigestRequest = await request.json()

    // 업데이트할 필드 구성
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.icon !== undefined) updateData.icon = body.icon
    if (body.category !== undefined) updateData.category = body.category
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.isPremium !== undefined) updateData.isPremium = body.isPremium

    if (body.config) {
      const currentData = docSnapshot.data() as DigestDoc
      updateData.config = {
        ...currentData.config,
        ...body.config,
      }
    }

    await docRef.update(updateData)

    // 업데이트된 문서 반환
    const updated = await docRef.get()
    return NextResponse.json(toDigestResponse(updated.data() as DigestDoc))
  } catch (error) {
    console.error('Error updating digest:', error)
    return NextResponse.json(
      { error: '다이제스트 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/digests/[id] - 다이제스트 삭제
 * 관리자 전용
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    // TODO: Admin 권한 체크

    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.DIGESTS).doc(id)
    const docSnapshot = await docRef.get()

    if (!docSnapshot.exists) {
      return NextResponse.json(
        { error: '다이제스트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 구독자가 있는지 확인
    const subsCount = await db
      .collection(COLLECTIONS.DIGEST_SUBSCRIPTIONS)
      .where('digestId', '==', id)
      .where('isActive', '==', true)
      .count()
      .get()

    if (subsCount.data().count > 0) {
      // 구독자가 있으면 비활성화만
      await docRef.update({
        isActive: false,
        updatedAt: Timestamp.now(),
      })
      return NextResponse.json({ message: '다이제스트가 비활성화되었습니다.' })
    }

    // 구독자가 없으면 삭제
    await docRef.delete()
    return NextResponse.json({ message: '다이제스트가 삭제되었습니다.' })
  } catch (error) {
    console.error('Error deleting digest:', error)
    return NextResponse.json(
      { error: '다이제스트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
