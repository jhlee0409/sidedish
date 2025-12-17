import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WhisperResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { validateString, forbiddenResponse, CONTENT_LIMITS } from '@/lib/security-utils'

// GET /api/whispers - Get all whispers for the authenticated user (project author)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()

    // Note: Firestore requires a composite index for where + orderBy on different fields
    // To avoid index requirement, we fetch without orderBy and sort in JavaScript
    const snapshot = await db
      .collection(COLLECTIONS.WHISPERS)
      .where('projectAuthorId', '==', user.uid)
      .get()

    const whispers: WhisperResponse[] = snapshot.docs
      .map(doc => {
        const data = doc.data()
        return {
          id: doc.id,
          projectId: data.projectId,
          projectTitle: data.projectTitle,
          senderName: data.senderName,
          content: data.content,
          isRead: data.isRead || false,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ data: whispers })
  } catch (error) {
    console.error('Error fetching whispers:', error)
    return NextResponse.json(
      { error: '귓속말 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/whispers - Create a new whisper (requires auth)
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()
    const body: {
      projectId: string
      content: string
    } = await request.json()

    // Validate required fields
    if (!body.projectId) {
      return NextResponse.json(
        { error: '프로젝트 ID가 필요합니다.' },
        { status: 400 }
      )
    }

    // SECURITY: Validate content length
    const contentValidation = validateString(body.content, '귓속말 내용', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.WHISPER_MAX,
    })
    if (!contentValidation.valid) {
      return NextResponse.json({ error: contentValidation.error }, { status: 400 })
    }

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(body.projectId).get()
    if (!projectDoc.exists) {
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const projectData = projectDoc.data()!

    // SECURITY: Prevent users from whispering to their own project
    if (projectData.authorId === user.uid) {
      return forbiddenResponse('자신의 프로젝트에는 귓속말을 보낼 수 없습니다.')
    }

    const now = Timestamp.now()
    const whisperRef = db.collection(COLLECTIONS.WHISPERS).doc()

    const whisperData = {
      id: whisperRef.id,
      projectId: body.projectId,
      projectTitle: projectData.title || '',
      projectAuthorId: projectData.authorId,
      senderName: user.name || 'Anonymous',
      senderId: user.uid,
      content: contentValidation.value, // Use validated content
      isRead: false,
      createdAt: now,
    }

    await whisperRef.set(whisperData)

    const response: WhisperResponse = {
      id: whisperRef.id,
      projectId: whisperData.projectId,
      projectTitle: whisperData.projectTitle,
      senderName: whisperData.senderName,
      content: whisperData.content,
      isRead: false,
      createdAt: now.toDate().toISOString(),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating whisper:', error)
    return NextResponse.json(
      { error: '귓속말 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
