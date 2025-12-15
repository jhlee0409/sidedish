import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { UpdateProjectInput, ProjectResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'

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
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const data = doc.data()!
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
      platform: data.platform,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      { error: '프로젝트를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check ownership
    const projectData = doc.data()!
    if (projectData.authorId !== user.uid) {
      return forbiddenResponse('이 프로젝트를 수정할 권한이 없습니다.')
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
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

    await docRef.update(updateData)

    // Fetch updated document
    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()!

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
      platform: data.platform,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating project:', error)
    return NextResponse.json(
      { error: '프로젝트 수정에 실패했습니다.' },
      { status: 500 }
    )
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
      return NextResponse.json(
        { error: '프로젝트를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Check ownership
    const projectData = doc.data()!
    if (projectData.authorId !== user.uid) {
      return forbiddenResponse('이 프로젝트를 삭제할 권한이 없습니다.')
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
    console.error('Error deleting project:', error)
    return NextResponse.json(
      { error: '프로젝트 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
