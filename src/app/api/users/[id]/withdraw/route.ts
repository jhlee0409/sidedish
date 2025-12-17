import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

interface WithdrawRequest {
  reason: string
  feedback?: string
}

// POST /api/users/[id]/withdraw - Soft delete (회원 탈퇴)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 인증 확인
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      )
    }

    // 본인만 탈퇴 가능
    if (authUser.uid !== id) {
      return NextResponse.json(
        { error: '본인의 계정만 탈퇴할 수 있습니다.' },
        { status: 403 }
      )
    }

    const db = getAdminDb()
    const body: WithdrawRequest = await request.json()

    // 탈퇴 사유 검증
    if (!body.reason || typeof body.reason !== 'string') {
      return NextResponse.json(
        { error: '탈퇴 사유를 입력해주세요.' },
        { status: 400 }
      )
    }

    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()
    const now = Timestamp.now()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const userData = doc.data()

    // 이미 탈퇴한 계정인지 확인
    if (userData?.isWithdrawn) {
      return NextResponse.json(
        { error: '이미 탈퇴 처리된 계정입니다.' },
        { status: 400 }
      )
    }

    // Soft delete: 사용자를 탈퇴 상태로 표시
    // 법적 보관 기간(1년)이 지난 후 완전 삭제를 위해 데이터 보관
    await docRef.update({
      isWithdrawn: true,
      withdrawnAt: now,
      withdrawalReason: body.reason.slice(0, 500), // 최대 500자
      withdrawalFeedback: body.feedback?.slice(0, 1000) || '', // 최대 1000자
      // 개인정보는 보관하되, 프로필은 비활성화 표시
      name: `탈퇴한 사용자`,
      avatarUrl: '',
      isProfileComplete: false,
      updatedAt: now,
    })

    // 사용자가 작성한 프로젝트, 댓글 등은 soft delete 하지 않음
    // (법적 보관 목적 + 서비스 무결성 유지)
    // 대신 작성자 이름만 익명화
    const batch = db.batch()

    // 프로젝트 작성자명 익명화
    const projectsSnapshot = await db
      .collection(COLLECTIONS.PROJECTS)
      .where('authorId', '==', id)
      .get()

    projectsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        authorName: '탈퇴한 셰프',
        updatedAt: now,
      })
    })

    // 댓글 작성자명 익명화
    const commentsSnapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('authorId', '==', id)
      .get()

    commentsSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        authorName: '탈퇴한 사용자',
        avatarUrl: '',
      })
    })

    // 귓속말 발신자명 익명화
    const whispersSnapshot = await db
      .collection(COLLECTIONS.WHISPERS)
      .where('senderId', '==', id)
      .get()

    whispersSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, {
        senderName: '탈퇴한 사용자',
      })
    })

    await batch.commit()

    return NextResponse.json({
      success: true,
      message: '회원 탈퇴가 완료되었습니다.',
    })
  } catch (error) {
    console.error('Error withdrawing user:', error)
    return NextResponse.json(
      { error: '회원 탈퇴 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}
