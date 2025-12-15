import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/users/[id]/likes - Get all project IDs that a user has liked
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    const likesSnapshot = await db
      .collection(COLLECTIONS.LIKES)
      .where('userId', '==', id)
      .get()

    const likedProjectIds = likesSnapshot.docs.map(doc => doc.data().projectId)

    return NextResponse.json({
      userId: id,
      likedProjectIds,
      count: likedProjectIds.length,
    })
  } catch (error) {
    console.error('Error fetching user likes:', error)
    return NextResponse.json(
      { error: '좋아요 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
