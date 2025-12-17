import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { WhisperResponse } from '@/lib/db-types'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'

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
      return NextResponse.json(
        { error: '귓속말을 찾을 수 없습니다.' },
        { status: 404 }
      )
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
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching whisper:', error)
    return NextResponse.json(
      { error: '귓속말을 불러오는데 실패했습니다.' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '귓속말을 찾을 수 없습니다.' },
        { status: 404 }
      )
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
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating whisper:', error)
    return NextResponse.json(
      { error: '귓속말 업데이트에 실패했습니다.' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '귓속말을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const whisperData = doc.data()!

    // Only the project author can delete whispers
    if (whisperData.projectAuthorId !== user.uid) {
      return forbiddenResponse('이 귓속말을 삭제할 권한이 없습니다.')
    }

    await docRef.delete()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting whisper:', error)
    return NextResponse.json(
      { error: '귓속말 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
