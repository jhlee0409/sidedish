import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { UpdateProjectInput, ProjectResponse, ProjectPlatform, ProjectLinkDoc } from '@/lib/db-types'
import { Timestamp, UpdateData } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { validateProjectLinks, badRequestResponse } from '@/lib/security-utils'
import { convertTimestamps, convertPromotionPosts } from '@/lib/firestore-utils'
import { handleApiError, notFoundResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'
import { del } from '@vercel/blob'

// Typed update data for project patches
interface ProjectUpdateFields {
  updatedAt: Timestamp
  title?: string
  description?: string
  shortDescription?: string
  tags?: string[]
  imageUrl?: string
  link?: string
  githubUrl?: string
  links?: ProjectLinkDoc[]
  platform?: ProjectPlatform
  isBeta?: boolean
}

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/projects/[id] - Get a single project (public)
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    const doc = await db.collection(COLLECTIONS.PROJECTS).doc(id).get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
    }

    const data = doc.data()!
    const timestamps = convertTimestamps(data, ['createdAt', 'updatedAt'])

    const response: ProjectResponse = {
      id: doc.id,
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      tags: data.tags || [],
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      authorName: data.authorName,
      likes: data.likes || 0,
      reactions: data.reactions || {},
      link: data.link,
      githubUrl: data.githubUrl,
      links: data.links || [],
      platform: data.platform,
      isBeta: data.isBeta,
      promotionPosts: convertPromotionPosts(data.promotionPosts),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/projects/[id]', ERROR_MESSAGES.PROJECT_FETCH_FAILED)
  }
}

// PATCH /api/projects/[id] - Update a project (requires auth + ownership)
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
    const body: UpdateProjectInput = await request.json()

    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
    }

    // Check ownership
    const projectData = doc.data()!
    if (projectData.authorId !== user.uid) {
      return forbiddenResponse('이 프로젝트를 수정할 권한이 없습니다.')
    }

    // Build update object with only provided fields
    const updateData: ProjectUpdateFields = {
      updatedAt: Timestamp.now(),
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.shortDescription !== undefined) updateData.shortDescription = body.shortDescription
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl
    if (body.link !== undefined) updateData.link = body.link
    if (body.githubUrl !== undefined) updateData.githubUrl = body.githubUrl
    if (body.platform !== undefined) updateData.platform = body.platform
    if (body.isBeta !== undefined) updateData.isBeta = body.isBeta

    // Links 배열 검증 및 업데이트
    if (body.links !== undefined) {
      const linksValidation = validateProjectLinks(body.links, '스토어 링크')
      if (!linksValidation.valid) return badRequestResponse(linksValidation.error)
      updateData.links = linksValidation.value as ProjectLinkDoc[]
    }

    // Delete old image from Vercel Blob if image is being updated
    if (body.imageUrl !== undefined && body.imageUrl !== projectData.imageUrl) {
      const oldImageUrl = projectData.imageUrl
      if (oldImageUrl && oldImageUrl.includes('blob.vercel-storage.com')) {
        try {
          await del(oldImageUrl)
        } catch (error) {
          console.error('Error deleting old image from Vercel Blob:', error)
        }
      }
    }

    await docRef.update(updateData as UpdateData<ProjectUpdateFields>)

    // Fetch updated document
    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()!
    const timestamps = convertTimestamps(data, ['createdAt', 'updatedAt'])

    const response: ProjectResponse = {
      id: updatedDoc.id,
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      tags: data.tags || [],
      imageUrl: data.imageUrl,
      authorId: data.authorId,
      authorName: data.authorName,
      likes: data.likes || 0,
      reactions: data.reactions || {},
      link: data.link,
      githubUrl: data.githubUrl,
      links: data.links || [],
      platform: data.platform,
      isBeta: data.isBeta,
      promotionPosts: convertPromotionPosts(data.promotionPosts),
      createdAt: timestamps.createdAt,
      updatedAt: timestamps.updatedAt,
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/projects/[id]', ERROR_MESSAGES.PROJECT_UPDATE_FAILED)
  }
}

// DELETE /api/projects/[id] - Delete a project (requires auth + ownership)
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

    const docRef = db.collection(COLLECTIONS.PROJECTS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.PROJECT_NOT_FOUND)
    }

    // Check ownership
    const projectData = doc.data()!
    if (projectData.authorId !== user.uid) {
      return forbiddenResponse('이 프로젝트를 삭제할 권한이 없습니다.')
    }

    // Delete image from Vercel Blob if it exists
    const imageUrl = projectData.imageUrl
    if (imageUrl && imageUrl.includes('blob.vercel-storage.com')) {
      try {
        await del(imageUrl)
      } catch (error) {
        console.error('Error deleting image from Vercel Blob:', error)
        // Continue with project deletion even if image deletion fails
      }
    }

    // Delete related comments
    const commentsSnapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('projectId', '==', id)
      .get()

    const batch = db.batch()
    commentsSnapshot.docs.forEach(commentDoc => {
      batch.delete(commentDoc.ref)
    })

    // Delete related likes
    const likesSnapshot = await db
      .collection(COLLECTIONS.LIKES)
      .where('projectId', '==', id)
      .get()

    likesSnapshot.docs.forEach(likeDoc => {
      batch.delete(likeDoc.ref)
    })

    // Delete related whispers
    const whispersSnapshot = await db
      .collection(COLLECTIONS.WHISPERS)
      .where('projectId', '==', id)
      .get()

    whispersSnapshot.docs.forEach(whisperDoc => {
      batch.delete(whisperDoc.ref)
    })

    // Delete the project itself
    batch.delete(docRef)

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, 'DELETE /api/projects/[id]', ERROR_MESSAGES.PROJECT_DELETE_FAILED)
  }
}
