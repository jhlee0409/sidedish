import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/comments/[id] - Get a single comment (public)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    const doc = await db.collection(COLLECTIONS.COMMENTS).doc(id).get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const data = doc.data()!
    const response: CommentResponse = {
      id: doc.id,
      projectId: data.projectId,
      authorId: data.authorId,
      authorName: data.authorName,
      avatarUrl: data.avatarUrl,
      content: data.content,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching comment:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/comments/[id] - Delete a comment (requires auth + ownership)
export async function DELETE(
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

    const docRef = db.collection(COLLECTIONS.COMMENTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '댓글을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check if user is the author
    const data = doc.data()!
    if (data.authorId !== user.uid) {
      return forbiddenResponse('이 댓글을 삭제할 권한이 없습니다.')
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting comment:', error)
    return NextResponse.json(
      { error: '댓글 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
