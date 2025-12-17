import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { UpdateUserInput, UserResponse, UserAgreementsResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { del } from '@vercel/blob'

// Vercel Blob URL 패턴 확인 (커스텀 업로드 이미지인지)
function isVercelBlobUrl(url: string): boolean {
  return url.includes('public.blob.vercel-storage.com')
}

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

    // 약관 동의 정보 변환
    let agreements: UserAgreementsResponse | undefined
    if (data.agreements) {
      agreements = {
        termsOfService: data.agreements.termsOfService || false,
        privacyPolicy: data.agreements.privacyPolicy || false,
        marketing: data.agreements.marketing || false,
        agreedAt: data.agreements.agreedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }
    }

    const response: UserResponse = {
      id: doc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      agreements,
      isProfileComplete: data.isProfileComplete || false,
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
    const now = Timestamp.now()

    if (!doc.exists) {
      // Create user if not exists (for seamless user experience)
      const newUserData: Record<string, unknown> = {
        id,
        name: body.name || 'Anonymous Chef',
        avatarUrl: body.avatarUrl || '',
        isProfileComplete: body.isProfileComplete || false,
        createdAt: now,
        updatedAt: now,
      }

      // 약관 동의 정보 추가
      if (body.agreements) {
        newUserData.agreements = {
          termsOfService: body.agreements.termsOfService,
          privacyPolicy: body.agreements.privacyPolicy,
          marketing: body.agreements.marketing,
          agreedAt: now,
        }
      }

      await docRef.set(newUserData)

      // 약관 동의 응답 변환
      let agreementsResponse: UserAgreementsResponse | undefined
      if (body.agreements) {
        agreementsResponse = {
          termsOfService: body.agreements.termsOfService,
          privacyPolicy: body.agreements.privacyPolicy,
          marketing: body.agreements.marketing,
          agreedAt: now.toDate().toISOString(),
        }
      }

      return NextResponse.json({
        id,
        name: newUserData.name,
        avatarUrl: newUserData.avatarUrl,
        agreements: agreementsResponse,
        isProfileComplete: newUserData.isProfileComplete,
        createdAt: now.toDate().toISOString(),
      })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.isProfileComplete !== undefined) updateData.isProfileComplete = body.isProfileComplete
    if (body.avatarUrl !== undefined) {
      updateData.avatarUrl = body.avatarUrl

      // 이전 avatarUrl이 Vercel Blob URL인 경우 삭제 (새 URL과 다를 때만)
      const previousAvatarUrl = doc.data()?.avatarUrl
      if (
        previousAvatarUrl &&
        previousAvatarUrl !== body.avatarUrl &&
        isVercelBlobUrl(previousAvatarUrl)
      ) {
        try {
          await del(previousAvatarUrl)
        } catch (deleteError) {
          // 이미지 삭제 실패는 치명적이지 않으므로 로그만 남기고 계속 진행
          console.error('Failed to delete previous avatar:', deleteError)
        }
      }
    }

    // 약관 동의 정보 업데이트
    if (body.agreements) {
      updateData.agreements = {
        termsOfService: body.agreements.termsOfService,
        privacyPolicy: body.agreements.privacyPolicy,
        marketing: body.agreements.marketing,
        agreedAt: now,
      }
    }

    await docRef.update(updateData)

    // Fetch updated document
    const updatedDoc = await docRef.get()
    const data = updatedDoc.data()!

    // 약관 동의 응답 변환
    let agreementsResponse: UserAgreementsResponse | undefined
    if (data.agreements) {
      agreementsResponse = {
        termsOfService: data.agreements.termsOfService || false,
        privacyPolicy: data.agreements.privacyPolicy || false,
        marketing: data.agreements.marketing || false,
        agreedAt: data.agreements.agreedAt?.toDate?.()?.toISOString() || now.toDate().toISOString(),
      }
    }

    const response: UserResponse = {
      id: updatedDoc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      agreements: agreementsResponse,
      isProfileComplete: data.isProfileComplete || false,
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

    // Fetch all related data in parallel for better performance
    const [projectsSnapshot, userCommentsSnapshot, userLikesSnapshot, userReactionsSnapshot] = await Promise.all([
      db.collection(COLLECTIONS.PROJECTS).where('authorId', '==', id).get(),
      db.collection(COLLECTIONS.COMMENTS).where('authorId', '==', id).get(),
      db.collection(COLLECTIONS.LIKES).where('userId', '==', id).get(),
      db.collection(COLLECTIONS.REACTIONS).where('userId', '==', id).get(),
    ])

    const projectIds = projectsSnapshot.docs.map(doc => doc.id)

    // Fetch all project-related data in parallel (comments, likes, whispers, reactions for all projects)
    let projectRelatedDocs: FirebaseFirestore.DocumentReference[] = []

    if (projectIds.length > 0) {
      // Process in chunks of 30 for 'in' query limit
      const chunkPromises: Promise<FirebaseFirestore.QuerySnapshot>[] = []

      for (let i = 0; i < projectIds.length; i += 30) {
        const chunk = projectIds.slice(i, i + 30)
        chunkPromises.push(
          db.collection(COLLECTIONS.COMMENTS).where('projectId', 'in', chunk).get(),
          db.collection(COLLECTIONS.LIKES).where('projectId', 'in', chunk).get(),
          db.collection(COLLECTIONS.WHISPERS).where('projectId', 'in', chunk).get(),
          db.collection(COLLECTIONS.REACTIONS).where('projectId', 'in', chunk).get(),
        )
      }

      const results = await Promise.all(chunkPromises)
      projectRelatedDocs = results.flatMap(snapshot => snapshot.docs.map(doc => doc.ref))
    }

    // Collect all documents to delete
    const allDocsToDelete: FirebaseFirestore.DocumentReference[] = [
      ...projectsSnapshot.docs.map(doc => doc.ref),
      ...userCommentsSnapshot.docs.map(doc => doc.ref),
      ...userLikesSnapshot.docs.map(doc => doc.ref),
      ...userReactionsSnapshot.docs.map(doc => doc.ref),
      ...projectRelatedDocs,
      docRef,
    ]

    // Remove duplicates (user's own comments on their projects might be counted twice)
    const uniqueDocs = [...new Map(allDocsToDelete.map(ref => [ref.path, ref])).values()]

    // Firestore batch limit is 500 operations, split into multiple batches if needed
    const BATCH_LIMIT = 500
    const batches: FirebaseFirestore.WriteBatch[] = []

    for (let i = 0; i < uniqueDocs.length; i += BATCH_LIMIT) {
      const batch = db.batch()
      const chunk = uniqueDocs.slice(i, i + BATCH_LIMIT)
      chunk.forEach(ref => batch.delete(ref))
      batches.push(batch)
    }

    // Execute all batches in parallel
    await Promise.all(batches.map(batch => batch.commit()))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: '사용자 삭제에 실패했습니다.' },
      { status: 500 }
    )
  }
}
