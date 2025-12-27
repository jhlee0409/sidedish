import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { verifyAuth, unauthorizedResponse } from '@/lib/auth-utils'
import { handleApiError, badRequestResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { getAdminDb } from '@/lib/firebase-admin'

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const user = await verifyAuth(request)
    if (!user) {
      return unauthorizedResponse()
    }

    const { searchParams } = new URL(request.url)
    const url = searchParams.get('url')

    if (!url) {
      return badRequestResponse('삭제할 파일 URL을 지정해주세요.')
    }

    // Parse URL to extract type and entityId
    // URL format: https://.../sidedish/{type}s/{entityId}/{timestamp}.{ext}
    const urlParts = url.split('/')
    const blobIndex = urlParts.findIndex((part) => part === 'sidedish')

    if (blobIndex === -1 || urlParts.length < blobIndex + 4) {
      return badRequestResponse('올바르지 않은 파일 URL입니다.')
    }

    const typeFolder = urlParts[blobIndex + 1] // "profiles" or "projects"
    const entityId = urlParts[blobIndex + 2]

    // Extract type from folder name
    const type = typeFolder === 'profiles' ? 'profile' : typeFolder === 'projects' ? 'project' : null

    if (!type) {
      return badRequestResponse('올바르지 않은 파일 경로입니다.')
    }

    // SECURITY: Verify user has permission to delete this file
    if (type === 'profile') {
      if (entityId !== user.uid) {
        return NextResponse.json(
          { error: '자신의 프로필 사진만 삭제할 수 있습니다.' },
          { status: 403 }
        )
      }
    } else if (type === 'project') {
      // Verify project ownership
      const adminDb = getAdminDb()
      const projectDoc = await adminDb.collection('projects').doc(entityId).get()

      if (!projectDoc.exists) {
        return NextResponse.json({ error: '프로젝트를 찾을 수 없습니다.' }, { status: 404 })
      }

      const project = projectDoc.data()
      if (project?.authorId !== user.uid) {
        return NextResponse.json(
          { error: '자신의 프로젝트 이미지만 삭제할 수 있습니다.' },
          { status: 403 }
        )
      }
    }

    // Delete file from Vercel Blob
    await del(url)

    // uploads collection 메타데이터 삭제
    const uploadId = new URL(url).pathname.split('/').pop()
    if (uploadId) {
      const adminDb = getAdminDb()
      await adminDb.collection('uploads').doc(uploadId).delete().catch((err) => {
        console.error('Failed to delete upload metadata:', err)
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/upload/delete', ERROR_MESSAGES.UPLOAD_FAILED)
  }
}
