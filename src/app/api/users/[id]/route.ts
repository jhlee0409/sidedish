import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { UpdateUserInput, UserResponse, UserAgreementsResponse } from '@/lib/db-types'
import { Timestamp } from 'firebase-admin/firestore'
import { del } from '@vercel/blob'
import { verifyAuth, unauthorizedResponse, forbiddenResponse } from '@/lib/auth-utils'
import { timestampToISO } from '@/lib/firestore-utils'
import { handleApiError, notFoundResponse, badRequestResponse } from '@/lib/api-helpers'
import { ERROR_MESSAGES } from '@/lib/error-messages'

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
      return notFoundResponse(ERROR_MESSAGES.USER_NOT_FOUND)
    }

    const data = doc.data()!

    // 약관 동의 정보 변환
    let agreements: UserAgreementsResponse | undefined
    if (data.agreements) {
      agreements = {
        termsOfService: data.agreements.termsOfService || false,
        privacyPolicy: data.agreements.privacyPolicy || false,
        marketing: data.agreements.marketing || false,
        agreedAt: timestampToISO(data.agreements.agreedAt),
      }
    }

    const response: UserResponse = {
      id: doc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      role: data.role || 'user',
      agreements,
      isProfileComplete: data.isProfileComplete || false,
      createdAt: timestampToISO(data.createdAt),
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'GET /api/users/[id]', ERROR_MESSAGES.USER_FETCH_FAILED)
  }
}

// 닉네임 검증 함수
function validateName(name: string): { valid: boolean; error?: string } {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: '닉네임은 필수입니다.' }
  }
  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: '닉네임은 2자 이상이어야 합니다.' }
  }
  if (trimmed.length > 20) {
    return { valid: false, error: '닉네임은 20자 이하여야 합니다.' }
  }
  // 한글, 영문, 숫자, 밑줄, 공백만 허용
  const validPattern = /^[가-힣a-zA-Z0-9_\s]+$/
  if (!validPattern.test(trimmed)) {
    return { valid: false, error: '닉네임에 특수문자는 사용할 수 없습니다.' }
  }
  return { valid: true }
}

// 약관 동의 검증 함수
function validateAgreements(agreements: UpdateUserInput['agreements']): { valid: boolean; error?: string } {
  if (!agreements) {
    return { valid: true } // agreements는 선택적
  }
  if (agreements.termsOfService !== true) {
    return { valid: false, error: '서비스 이용약관에 동의해야 합니다.' }
  }
  if (agreements.privacyPolicy !== true) {
    return { valid: false, error: '개인정보 처리방침에 동의해야 합니다.' }
  }
  return { valid: true }
}

// PATCH /api/users/[id] - Update a user
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 인증 확인
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // 본인만 수정 가능
    if (authUser.uid !== id) {
      return forbiddenResponse('본인의 프로필만 수정할 수 있습니다.')
    }

    const db = getAdminDb()
    const body: UpdateUserInput = await request.json()

    // 서버 측 데이터 검증
    if (body.name !== undefined) {
      const nameValidation = validateName(body.name)
      if (!nameValidation.valid) {
        return badRequestResponse(nameValidation.error || '잘못된 닉네임입니다.')
      }
      body.name = body.name.trim()
    }

    // 약관 동의 검증 (isProfileComplete가 true로 설정될 때 필수)
    if (body.isProfileComplete === true && body.agreements) {
      const agreementsValidation = validateAgreements(body.agreements)
      if (!agreementsValidation.valid) {
        return badRequestResponse(agreementsValidation.error || '약관 동의가 필요합니다.')
      }
    }

    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()
    const now = Timestamp.now()

    if (!doc.exists) {
      // Create user if not exists (for seamless user experience)
      const newUserData: Record<string, unknown> = {
        id,
        email: authUser.email || '', // Firebase Auth에서 이메일 저장
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
          agreedAt: timestampToISO(now),
        }
      }

      return NextResponse.json({
        id,
        name: newUserData.name,
        avatarUrl: newUserData.avatarUrl,
        agreements: agreementsResponse,
        isProfileComplete: newUserData.isProfileComplete,
        createdAt: timestampToISO(now),
      })
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updatedAt: now,
    }

    // 기존 유저에 email 필드가 없으면 추가 (마이그레이션)
    const existingData = doc.data()
    if (!existingData?.email && authUser.email) {
      updateData.email = authUser.email
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
          // Blob 파일 삭제
          await del(previousAvatarUrl)

          // uploads collection 메타데이터 삭제
          const uploadId = new URL(previousAvatarUrl).pathname.split('/').pop()
          if (uploadId) {
            await db.collection('uploads').doc(uploadId).delete().catch((err) => {
              console.error('Failed to delete upload metadata:', err)
            })
          }
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
        agreedAt: timestampToISO(data.agreements.agreedAt),
      }
    }

    const response: UserResponse = {
      id: updatedDoc.id,
      name: data.name,
      avatarUrl: data.avatarUrl || '',
      role: data.role || 'user',
      agreements: agreementsResponse,
      isProfileComplete: data.isProfileComplete || false,
      createdAt: timestampToISO(data.createdAt),
    }

    return NextResponse.json(response)
  } catch (error) {
    return handleApiError(error, 'PATCH /api/users/[id]', ERROR_MESSAGES.USER_UPDATE_FAILED)
  }
}

// DELETE /api/users/[id] - Delete a user
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    // 인증 확인
    const authUser = await verifyAuth(request)
    if (!authUser) {
      return unauthorizedResponse()
    }

    // 본인만 삭제 가능
    if (authUser.uid !== id) {
      return forbiddenResponse('본인의 계정만 삭제할 수 있습니다.')
    }

    const db = getAdminDb()

    const docRef = db.collection(COLLECTIONS.USERS).doc(id)
    const doc = await docRef.get()

    if (!doc.exists) {
      return notFoundResponse(ERROR_MESSAGES.USER_NOT_FOUND)
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
    return handleApiError(error, 'DELETE /api/users/[id]', ERROR_MESSAGES.USER_DELETE_FAILED)
  }
}
