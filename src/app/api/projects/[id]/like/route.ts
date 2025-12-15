import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { Timestamp, FieldValue } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// POST /api/projects/[id]/like - Toggle like on a project (requires auth)
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { id } = await context.params
    const db = getAdminDb()

    // Check if project exists
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check if user is trying to like their own project
    const projectData = projectDoc.data()
    if (projectData?.authorId === user.uid) {
      return NextResponse.json(
        { error: '자신의 게시물은 찜할 수 없습니다.' },
        { status: 403 }
      )
    }

    // Check if user already liked this project
    const likeId = `${user.uid}_${id}`
    const likeRef = db.collection(COLLECTIONS.LIKES).doc(likeId)
    const likeDoc = await likeRef.get()

    if (likeDoc.exists) {
      // Unlike: Remove like document and decrement count
      await db.runTransaction(async (transaction) => {
        transaction.delete(likeRef)
        transaction.update(projectRef, {
          likes: FieldValue.increment(-1),
        })
      })

      return NextResponse.json({
        liked: false,
        likes: (projectDoc.data()?.likes || 1) - 1,
      })
    } else {
      // Like: Create like document and increment count
      await db.runTransaction(async (transaction) => {
        transaction.set(likeRef, {
          id: likeId,
          userId: user.uid,
          projectId: id,
          createdAt: Timestamp.now(),
        })
        transaction.update(projectRef, {
          likes: FieldValue.increment(1),
        })
      })

      return NextResponse.json({
        liked: true,
        likes: (projectDoc.data()?.likes || 0) + 1,
      })
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json(
      { error: '좋아요 처리에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// GET /api/projects/[id]/like - Check if current user liked a project (requires auth)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return NextResponse.json({ liked: false })
    }

    const { id } = await context.params
    const db = getAdminDb()

    const likeId = `${user.uid}_${id}`
    const likeDoc = await db.collection(COLLECTIONS.LIKES).doc(likeId).get()

    return NextResponse.json({
      liked: likeDoc.exists,
    })
  } catch (error) {
    console.error('Error checking like status:', error)
    return NextResponse.json(
      { error: '좋아요 상태 확인에 실패했습니다.' },
      { status: 500 }
    )
  }
}
