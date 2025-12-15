import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { CommentResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id]/comments - Get all comments for a project (public)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Note: Firestore requires a composite index for where + orderBy on different fields
    // To avoid index requirement, we fetch without orderBy and sort in JavaScript
    const snapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('projectId', '==', id)
      .get()

    const comments: CommentResponse[] = snapshot.docs
      .map(doc => {
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
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ data: comments })
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
