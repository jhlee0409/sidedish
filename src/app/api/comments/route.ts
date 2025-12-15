import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'

// GET /api/comments?authorId=xxx - Get all comments by a user
export async function GET(request: NextRequest) {
  try {
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams
    const authorId = searchParams.get('authorId')

    if (!authorId) {
      return NextResponse.json(
        { error: '작성자 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    const snapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('authorId', '==', authorId)
      .orderBy('createdAt', 'desc')
      .get()

    // Fetch project titles for each comment
    const comments: (CommentResponse & { projectTitle?: string })[] = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data()

        // Fetch project title
        let projectTitle = ''
        try {
          const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(data.projectId).get()
          if (projectDoc.exists) {
            projectTitle = projectDoc.data()?.title || ''
          }
        } catch {
          // Ignore if project doesn't exist
        }

        return {
          id: doc.id,
          projectId: data.projectId,
          projectTitle,
          authorId: data.authorId,
          authorName: data.authorName,
          avatarUrl: data.avatarUrl,
          content: data.content,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      })
    )

    return NextResponse.json({ data: comments })
  } catch (error) {
    console.error('Error fetching user comments:', error)
    return NextResponse.json(
      { error: '댓글 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}
