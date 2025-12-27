import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WhisperResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { validateString, forbiddenResponse, CONTENT_LIMITS } from '@/lib/security-utils'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, badRequestResponse, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

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
          createdAt: timestampToISO(data.createdAt),
        }
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ data: whispers })
  } catch (error) {
    return handleApiError(error, 'GET /api/whispers', ERROR_MESSAGES.WHISPERS_FETCH_FAILED)
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
      return badRequestResponse(ERROR_MESSAGES.BAD_REQUEST)
    }

    // SECURITY: Validate content length
    const contentValidation = validateString(body.content, '귓속말 내용', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.WHISPER_MAX,
    })
    if (!contentValidation.valid) {
      return badRequestResponse(contentValidation.error || ERROR_MESSAGES.BAD_REQUEST)
    }

    // Check if project exists
    const projectDoc = await db.collection(COLLECTIONS.PROJECTS).doc(body.projectId).get()
    if (!projectDoc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
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
      createdAt: timestampToISO(now),
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    return handleApiError(error, 'POST /api/whispers', ERROR_MESSAGES.WHISPER_CREATE_FAILED)
  }
}
