import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { validateString, validateLimit, CONTENT_LIMITS, badRequestResponse } from '@/lib/security-utils'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/comments - Get comments for a project with pagination (public)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()
    const searchParams = request.nextUrl.searchParams

    // SECURITY: Validate pagination parameters
    const limit = validateLimit(searchParams.get('limit'), 20, 50)
    const cursor = searchParams.get('cursor')

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
    }

    // Use composite index (projectId + createdAt) for efficient query
    let query = db
      .collection(COLLECTIONS.COMMENTS)
      .where('projectId', '==', id)
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

    // Fetch user roles for all comment authors
    const authorIds = [...new Set(docs.map(doc => doc.data().authorId))]
    const userRoles: Record<string, string> = {}

    if (authorIds.length > 0) {
      const userDocs = await Promise.all(
        authorIds.map(uid => db.collection(COLLECTIONS.USERS).doc(uid).get())
      )
      userDocs.forEach(userDoc => {
        if (userDoc.exists) {
          userRoles[userDoc.id] = userDoc.data()?.role || 'user'
        }
      })
    }

    const comments: CommentResponse[] = docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        projectId: data.projectId,
        authorId: data.authorId,
        authorName: data.authorName,
        avatarUrl: data.avatarUrl,
        role: userRoles[data.authorId] as CommentResponse['role'],
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
    return handleApiError(error, 'GET /api/projects/[id]/comments', ERROR_MESSAGES.COMMENTS_FETCH_FAILED)
  }
}

// POST /api/projects/[id]/comments - Add a comment to a project (requires auth)
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
    const body: { content: string } = await request.json()

    // SECURITY: Validate comment content with length limits
    const contentValidation = validateString(body.content, '댓글 내용', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.COMMENT_MAX,
    })
    if (!contentValidation.valid) {
      return badRequestResponse(contentValidation.error)
    }

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
    }

    // Fetch user's role
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(user.uid).get()
    const userRole = userDoc.exists ? (userDoc.data()?.role || 'user') : 'user'

    const now = Timestamp.now()
    const commentRef = db.collection(COLLECTIONS.COMMENTS).doc()

    const commentData = {
      id: commentRef.id,
      projectId: id,
      authorId: user.uid,
      authorName: user.name || 'Anonymous',
      avatarUrl: user.picture || '',
      content: contentValidation.value, // Use validated content
      createdAt: now,
    }

    await commentRef.set(commentData)

    const response: CommentResponse = {
      ...commentData,
      role: userRole as CommentResponse['role'],
      createdAt: timestampToISO(now),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/projects/[id]/comments', ERROR_MESSAGES.COMMENT_CREATE_FAILED)
  }
}
