import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { UpdateUserInput, UserResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/users/[id] - Get a single user
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    const doc = await db.collection(COLLECTIONS.USERS).doc(id).get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    const data = doc.data()!
    const response: UserResponse = {
      id: doc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: '사용자를 불러오는데 실패했습니다.' },
      { status: 500 }
    )
  }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()
    const body: UpdateUserInput = await request.json()

    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      // Create user if not exists (for seamless user experience)
      const now = Timestamp.now()
      const newUserData = {
        id,
        name: body.name || 'Anonymous Chef',
        avatarUrl: body.avatarUrl || '',
        createdAt: now,
        updatedAt: now,
      }
      await docRef.set(newUserData)

      return NextResponse.json({
        id,
        name: newUserData.name,
        avatarUrl: newUserData.avatarUrl,
        createdAt: now.toDate().toISOString(),
      })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl

    await docRef.update(updateData)

    // Fetch updated document
    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()!

    const response: UserResponse = {
      id: updatedDoc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: '사용자 수정에 실패했습니다.' },
      { status: 500 }
    )
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const db = getAdminDb()

    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // Delete user's projects
    const projectsSnapshot = await db
      .collection(COLLECTIONS.PROJECTS)
      .where('authorId', '==', id)
      .get()

    const batch = db.batch()

    // Delete each project and its related data
    for (const projectDoc of projectsSnapshot.docs) {
      // Delete comments for this project
      const commentsSnapshot = await db
        .collection(COLLECTIONS.COMMENTS)
        .where('projectId', '==', projectDoc.id)
        .get()
      commentsSnapshot.docs.forEach(c => batch.delete(c.ref))

      // Delete likes for this project
      const likesSnapshot = await db
        .collection(COLLECTIONS.LIKES)
        .where('projectId', '==', projectDoc.id)
        .get()
      likesSnapshot.docs.forEach(l => batch.delete(l.ref))

      // Delete whispers for this project
      const whispersSnapshot = await db
        .collection(COLLECTIONS.WHISPERS)
        .where('projectId', '==', projectDoc.id)
        .get()
      whispersSnapshot.docs.forEach(w => batch.delete(w.ref))

      batch.delete(projectDoc.ref)
    }

    // Delete user's comments on other projects
    const userCommentsSnapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('authorId', '==', id)
      .get()
    userCommentsSnapshot.docs.forEach(c => batch.delete(c.ref))

    // Delete user's likes
    const userLikesSnapshot = await db
      .collection(COLLECTIONS.LIKES)
      .where('userId', '==', id)
      .get()
    userLikesSnapshot.docs.forEach(l => batch.delete(l.ref))

    // Delete the user
    batch.delete(docRef)

    await batch.commit()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
