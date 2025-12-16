import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'

// GET /api/comments?authorId=xxx - Get all comments by a user
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const authorId = searchParams.get('authorId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const cursor = searchParams.get('cursor')

    if (!authorId) {
      return NextResponse.json(
        { error: '작성자 ID가 필요합니다.' },
        { status: 400 }
      )
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
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    })

    const nextCursor = hasMore ? docs[docs.length - 1]?.id : undefined

    return NextResponse.json({
      data: comments,
      nextCursor,
      hasMore,
    })
  } catch (error) {
    console.error('Error fetching user comments:', error)
    return NextResponse.json(
      { error: '댓글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
