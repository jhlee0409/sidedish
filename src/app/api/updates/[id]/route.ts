import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// DELETE /api/updates/[id] - 업데이트 삭제 (requires auth, owner only)
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // 인증 확인
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const db = getAdminDb()

    // 업데이트 존재 확인
    const updateDoc = await db.collection(COLLECTIONS.PROJECT_UPDATES).doc(id).get()
    if (!updateDoc.exists) {
      return NextResponse.json(
        { error: '업데이트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const updateData = updateDoc.data()

    // 소유권 검증
    if (updateData?.authorId !== user.uid) {
      return NextResponse.json(
        { error: '본인의 업데이트만 삭제할 수 있습니다.' },
        { status: 403 }
      )
    }

    // 삭제
    await db.collection(COLLECTIONS.PROJECT_UPDATES).doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting update:', error)
    return NextResponse.json(
      { error: '업데이트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
