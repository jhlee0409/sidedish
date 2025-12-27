import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, badRequestResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

// GET /api/comments?authorId=xxx - Get all comments by a user
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const authorId = searchParams.get('authorId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')

    if (!authorId) {
      return badRequestResponse(ERROR_MESSAGES.BAD_REQUEST)
    }

    // Use composite index for efficient query with ordering
    let query = db
      .collection(COLLECTIONS.COMMENTS)
      .where('authorId', '==', authorId)
      .orderBy('createdAt', 'desc')

    // Apply cursor-based pagination
    if (cursor) {
      const cursorDoc = await db.collection(COLLECTIONS.COMMENTS).doc(cursor).get()
      if (cursorDoc.exists) {
        query = query.startAfter(cursorDoc)
      }
    }

    const snapshot = await query.limit(limit + 1).get()
    const hasMore = snapshot.docs.length > limit
    const docs = snapshot.docs.slice(0, limit)

    // Batch fetch project titles - collect unique projectIds first
    const projectIds = [...new Set(docs.map(doc => doc.data().projectId))]

    // Fetch all projects in a single batch query (max 30 per batch for 'in' query)
    const projectTitleMap = new Map<string, string>()

    // Split into chunks of 30 (Firestore 'in' query limit)
    for (let i = 0; i < projectIds.length; i += 30) {
      const chunk = projectIds.slice(i, i + 30)
      if (chunk.length > 0) {
        const projectsSnapshot = await db
          .collection(COLLECTIONS.PROJECTS)
          .where('__name__', 'in', chunk)
          .get()

        projectsSnapshot.docs.forEach(doc => {
          projectTitleMap.set(doc.id, doc.data()?.title || '')
        })
      }
    }

    // Map comments with project titles from cache
    const comments: (CommentResponse & { projectTitle?: string })[] = docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        projectId: data.projectId,
        projectTitle: projectTitleMap.get(data.projectId) || '',
        authorId: data.authorId,
        authorName: data.authorName,
        avatarUrl: data.avatarUrl,
        content: data.content,
        createdAt: timestampToISO(data.createdAt),
      }
    })

    const nextCursor = hasMore ? docs[docs.length - 1]?.id : undefined

    return NextResponse.json({
      data: comments,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    return handleApiError(error, 'GET /api/comments', ERROR_MESSAGES.COMMENTS_FETCH_FAILED)
  }
}
