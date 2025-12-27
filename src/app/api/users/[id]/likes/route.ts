import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { handleApiError } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/users/[id]/likes - Get project IDs that a user has liked with pagination
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams

    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')
    const all = searchParams.get('all') === 'true' // For backward compatibility

    // If 'all' is requested (for initial page load to check liked status), use larger limit
    if (all) {
      const likesSnapshot = await db
        .collection(COLLECTIONS.LIKES)
        .where('userId', '==', id)
        .limit(500) // Reasonable cap for all likes
        .get()

      const likedProjectIds = likesSnapshot.docs.map(doc => doc.data().projectId)

      return NextResponse.json({
        userId: id,
        likedProjectIds,
        count: likedProjectIds.length,
      })
    }

    // Use composite index for efficient pagination
    let query = db
      .collection(COLLECTIONS.LIKES)
      .where('userId', '==', id)
      .orderBy('createdAt', 'desc')

    // Apply cursor-based pagination
    if (cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.LIKES).doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const likesSnapshot = await query.limit(limit + 1).get()
    const hasMore = likesSnapshot.docs.length > limit
    const docs = likesSnapshot.docs.slice(0, limit)

    const likedProjectIds = docs.map(doc => doc.data().projectId)
    const nextCursor = hasMore ? docs[docs.length - 1]?.id : undefined

    return NextResponse.json({
      userId: id,
      likedProjectIds,
      count: likedProjectIds.length,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/users/[id]/likes', ERROR_MESSAGES.LIKES_FETCH_FAILED)
  }
}
