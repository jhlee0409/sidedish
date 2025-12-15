import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WhisperResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'

// GET /api/whispers - Get all whispers for the authenticated user (project author)
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const db = getAdminDb()

    const snapshot = await db
      .collection(COLLECTIONS.WHISPERS)
      .where('projectAuthorId', '==', user.uid)
      .orderBy('createdAt', 'desc')
      .get()

    const whispers: WhisperResponse[] = snapshot.docs.map(doc => {
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

    return NextResponse.json({ data: whispers })
  } catch (error) {
    console.error('Error fetching whispers:', error)
    return NextResponse.json(
      { error: '피드백 목록을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// POST /api/whispers - Create a new whisper (can be anonymous, but auth is optional)
export async function POST(request: NextRequest) {
  try {
    const db = getAdminDb()
    const body: {
      projectId: string
      content: string
      senderName?: string
    } = await request.json()

    // Validate required fields
    if (!body.projectId || !body.content) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다.' },
        { status: 400 }
      )
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

    // Check if authenticated (optional for whispers - they can be anonymous)
    const user = await verifyAuth(request)

    const now = Timestamp.now()
    const whisperRef = db.collection(COLLECTIONS.WHISPERS).doc()

    const whisperData = {
      id: whisperRef.id,
      projectId: body.projectId,
      projectTitle: projectData.title || '',
      projectAuthorId: projectData.authorId,
      senderName: user?.name || body.senderName || 'Anonymous',
      senderId: user?.uid || null,
      content: body.content,
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
      { error: '피드백 전송에 실패했습니다.' },
      { status: 500 }
    )
  }
}
