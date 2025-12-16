import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

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

    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const cursor = searchParams.get('cursor')

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
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

    const comments: CommentResponse[] = docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        projectId: data.projectId,
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
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: '댓글을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
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

    // Validate required fields
    if (!body.content) {
      return NextResponse.json(
        { error: '댓글 내용을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const now = Timestamp.now()
    const commentRef = db.collection(COLLECTIONS.COMMENTS).doc()

    const commentData = {
      id: commentRef.id,
      projectId: id,
      authorId: user.uid,
      authorName: user.name || 'Anonymous',
      avatarUrl: user.picture || '',
      content: body.content,
      createdAt: now,
    }

    await commentRef.set(commentData)

    const response: CommentResponse = {
      ...commentData,
      createdAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: '댓글 작성에 실패했습니다.' },
      { status: 500 }
    )
  }
}
