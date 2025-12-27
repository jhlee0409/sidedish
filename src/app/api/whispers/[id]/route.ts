import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WhisperResponse } from '@/lib/db-types'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/whispers/[id] - Get a single whisper (requires auth + ownership)
export async function GET(
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

    const doc = await db.collection(COLLECTIONS.WHISPERS).doc(id).get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.WHISPER_NOT_FOUND)
    }

    const data = doc.data()!

    // Only the project author can view whispers
    if (data.projectAuthorId !== user.uid) {
      return forbiddenResponse('이 귓속말을 볼 권한이 없습니다.')
    }

    const response: WhisperResponse = {
      id: doc.id,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      senderName: data.senderName,
      content: data.content,
      isRead: data.isRead || false,
      createdAt: timestampToISO(data.createdAt),
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/whispers/[id]', ERROR_MESSAGES.WHISPER_FETCH_FAILED)
  }
}

// PATCH /api/whispers/[id] - Mark whisper as read (requires auth + ownership)
export async function PATCH(
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
    const body = await request.json()

    const docRef = db.collection(COLLECTIONS.WHISPERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.WHISPER_NOT_FOUND)
    }

    const whisperData = doc.data()!

    // Only the project author can update whispers
    if (whisperData.projectAuthorId !== user.uid) {
      return forbiddenResponse('이 귓속말을 수정할 권한이 없습니다.')
    }

    // Update read status
    if (body.isRead !== undefined) {
      await docRef.update({ isRead: body.isRead })
    }

    // Fetch updated document
    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()!

    const response: WhisperResponse = {
      id: updatedDoc.id,
      projectId: data.projectId,
      projectTitle: data.projectTitle,
      senderName: data.senderName,
      content: data.content,
      isRead: data.isRead || false,
      createdAt: timestampToISO(data.createdAt),
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/whispers/[id]', ERROR_MESSAGES.WHISPER_UPDATE_FAILED)
  }
}

// DELETE /api/whispers/[id] - Delete a whisper (requires auth + ownership)
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

    const docRef = db.collection(COLLECTIONS.WHISPERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.WHISPER_NOT_FOUND)
    }

    const whisperData = doc.data()!

    // Only the project author can delete whispers
    if (whisperData.projectAuthorId !== user.uid) {
      return forbiddenResponse('이 귓속말을 삭제할 권한이 없습니다.')
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/whispers/[id]', ERROR_MESSAGES.WHISPER_DELETE_FAILED)
  }
}
