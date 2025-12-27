import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

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
      return notFoundResponse(ERROR_MESSAGES.COMMENT_NOT_FOUND)
    }

    const data = doc.data()!
    const response: CommentResponse = {
      id: doc.id,
      projectId: data.projectId,
      authorId: data.authorId,
      authorName: data.authorName,
      avatarUrl: data.avatarUrl,
      content: data.content,
      createdAt: timestampToISO(data.createdAt),
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/comments/[id]', ERROR_MESSAGES.COMMENT_FETCH_FAILED)
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
      return notFoundResponse(ERROR_MESSAGES.COMMENT_NOT_FOUND)
    }

    // Check if user is the author
    const data = doc.data()!
    if (data.authorId !== user.uid) {
      return forbiddenResponse('이 댓글을 삭제할 권한이 없습니다.')
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/comments/[id]', ERROR_MESSAGES.COMMENT_DELETE_FAILED)
  }
}
