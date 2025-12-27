import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { handleApiError, notFoundResponse, badRequestResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

interface RouteContext {
  params: Promise<{ id: string }>
}

// 30일을 밀리초로 변환
const REACTIVATION_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

// POST /api/users/[id]/reactivate - 탈퇴 계정 복구
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 인증 확인
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // 본인만 복구 가능
    if (authUser.uid !== id) {
      return forbiddenResponse('본인의 계정만 복구할 수 있습니다.')
    }

    const db = getAdminDb()
    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.USER_NOT_FOUND)
    }

    const userData = doc.data()

    // 탈퇴하지 않은 계정인 경우
    if (!userData?.isWithdrawn) {
      return badRequestResponse('탈퇴하지 않은 계정입니다.')
    }

    // 탈퇴 후 30일이 지났는지 확인
    const withdrawnAt = userData.withdrawnAt as Timestamp
    const withdrawnAtMs = withdrawnAt.toMillis()
    const now = Date.now()
    const daysSinceWithdrawal = Math.floor((now - withdrawnAtMs) / (24 * 60 * 60 * 1000))

    if (now - withdrawnAtMs > REACTIVATION_WINDOW_MS) {
      return badRequestResponse(
        `탈퇴 후 30일이 지나 계정을 복구할 수 없습니다. (탈퇴 후 ${daysSinceWithdrawal}일 경과)`
      )
    }

    // 계정 복구 - 탈퇴 관련 필드 초기화
    const batch = db.batch()

    // 사용자 정보 복구
    batch.update(docRef, {
      isWithdrawn: false,
      withdrawnAt: null,
      withdrawalReason: null,
      withdrawalFeedback: null,
      // 프로필 정보는 유지하되, 이름과 아바타가 익명화되었으므로 복구 필요
      // 원래 이름은 저장하지 않았으므로, 프로필 재설정 필요
      isProfileComplete: false,
      updatedAt: Timestamp.now(),
    })

    // 프로젝트 작성자명 복구는 하지 않음 (이름이 변경될 수 있으므로)
    // 사용자가 프로필 재설정 후 이름이 확정되면 프로젝트에 반영됨

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: '계정이 복구되었습니다. 프로필을 다시 설정해주세요.',
      needsProfileSetup: true,
    })
  } catch (error) {
    return handleApiError(error, 'POST /api/users/[id]/reactivate', '계정 복구에 실패했습니다.')
  }
}
