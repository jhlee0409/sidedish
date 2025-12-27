import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

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
      return notFoundResponse(ERROR_MESSAGES.UPDATE_NOT_FOUND)
    }

    const updateData = updateDoc.data()

    // 소유권 검증
    if (updateData?.authorId !== user.uid) {
      return forbiddenResponse('본인의 업데이트만 삭제할 수 있습니다.')
    }

    // 삭제
    await db.collection(COLLECTIONS.PROJECT_UPDATES).doc(id).delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/updates/[id]', ERROR_MESSAGES.UPDATE_DELETE_FAILED)
  }
}
