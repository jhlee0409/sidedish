/**
 * Project Server Actions
 *
 * 2025 베스트 프랙티스:
 * - Server Actions로 API Routes 대체
 * - 'use server' directive로 서버 실행 보장
 * - 타입 안전한 form handling
 * - Revalidation과 통합
 *
 * @see https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations
 * @see https://dev.to/yutakusuno/nextjs14-firebase-authentication-with-google-sign-in-using-cookies-middleware-and-server-actions-48h4
 *
 * 사용 예시:
 * ```tsx
 * 'use client'
 * import { createProject } from '@/actions/projects'
 *
 * export function ProjectForm() {
 *   const [state, formAction] = useFormState(createProject, null)
 *
 *   return (
 *     <form action={formAction}>
 *       <input name="title" required />
 *       <button type="submit">Create</button>
 *       {state?.error && <p>{state.error}</p>}
 *     </form>
 *   )
 * }
 * ```
 */

'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { cookies } from 'next/headers'
import { getAdminDb, COLLECTIONS } from '@/lib/firebase-admin'
import { getAuth } from 'firebase-admin/auth'
import { getAdminApp } from '@/lib/firebase-admin'
import { Timestamp } from 'firebase-admin/firestore'
import type { CreateProjectInput } from '@/lib/db-types'
import {
  validateString,
  validateUrl,
  validateTags,
  validateProjectLinks,
  isValidPlatform,
  CONTENT_LIMITS,
} from '@/lib/security-utils'

/**
 * Server Action Result Type
 */
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

/**
 * Get authenticated user from session cookie
 *
 * TODO: httpOnly 쿠키 기반 인증 구현
 * 현재: Bearer token 방식 (API Routes와 동일)
 */
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies()
    const authToken = cookieStore.get('auth-token')

    if (!authToken) {
      return null
    }

    const auth = getAuth(getAdminApp())
    const decodedToken = await auth.verifyIdToken(authToken.value)

    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
    }
  } catch (error) {
    console.error('Auth verification error:', error)
    return null
  }
}

/**
 * Create Project - Server Action
 *
 * 장점:
 * - Progressive Enhancement (JS 없이도 작동)
 * - 자동 revalidation
 * - 간단한 에러 처리
 */
export async function createProject(
  prevState: ActionResult<string> | null,
  formData: FormData
): Promise<ActionResult<string>> {
  try {
    // 1. Authentication check
    const user = await getAuthenticatedUser()
    if (!user) {
      return {
        success: false,
        error: '로그인이 필요합니다.',
      }
    }

    // 2. Extract and validate form data
    const title = formData.get('title') as string
    const shortDescription = formData.get('shortDescription') as string
    const description = formData.get('description') as string
    const tags = formData.get('tags') as string // Comma-separated
    const imageUrl = formData.get('imageUrl') as string
    const platform = formData.get('platform') as string
    const isBeta = formData.get('isBeta') === 'true'

    // 3. Validate inputs
    const titleValidation = validateString(title, '제목', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
    })
    if (!titleValidation.valid) {
      return { success: false, error: titleValidation.error! }
    }

    const shortDescValidation = validateString(shortDescription, '간단 소개', {
      required: true,
      minLength: 1,
      maxLength: CONTENT_LIMITS.PROJECT_SHORT_DESC_MAX,
    })
    if (!shortDescValidation.valid) {
      return { success: false, error: shortDescValidation.error! }
    }

    const descValidation = validateString(description, '상세 설명', {
      required: false,
      maxLength: CONTENT_LIMITS.PROJECT_DESC_MAX,
    })
    if (!descValidation.valid) {
      return { success: false, error: descValidation.error! }
    }

    const parsedTags = tags ? tags.split(',').map(t => t.trim()) : []
    const tagsValidation = validateTags(parsedTags)
    if (!tagsValidation.valid) {
      return { success: false, error: tagsValidation.error! }
    }

    const validPlatform = isValidPlatform(platform) ? platform : 'OTHER'

    // 4. Create project in Firestore
    const db = getAdminDb()
    const now = Timestamp.now()
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc()

    const projectData = {
      id: projectRef.id,
      title: titleValidation.value,
      description: descValidation.value,
      shortDescription: shortDescValidation.value,
      tags: tagsValidation.value,
      imageUrl: imageUrl || '',
      authorId: user.uid,
      authorName: user.name || 'Anonymous Chef',
      likes: 0,
      reactions: {},
      link: '', // 하위 호환
      links: [],
      platform: validPlatform,
      isBeta,
      createdAt: now,
      updatedAt: now,
    }

    await projectRef.set(projectData)

    // 5. Revalidate affected pages
    revalidatePath('/dashboard')
    revalidatePath(`/menu/${projectRef.id}`)
    revalidateTag('projects', 'max')

    return {
      success: true,
      data: projectRef.id,
    }
  } catch (error) {
    console.error('Error creating project:', error)
    return {
      success: false,
      error: '프로젝트 생성에 실패했습니다.',
    }
  }
}

/**
 * Update Project - Server Action
 */
export async function updateProject(
  projectId: string,
  prevState: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  try {
    // 1. Authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. Check ownership
    const db = getAdminDb()
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.' }
    }

    const projectData = projectDoc.data()!
    if (projectData.authorId !== user.uid) {
      return { success: false, error: '권한이 없습니다.' }
    }

    // 3. Extract and validate updates
    const title = formData.get('title') as string | null
    const updates: Record<string, unknown> = {
      updatedAt: Timestamp.now(),
    }

    if (title) {
      const titleValidation = validateString(title, '제목', {
        required: true,
        minLength: 1,
        maxLength: CONTENT_LIMITS.PROJECT_TITLE_MAX,
      })
      if (!titleValidation.valid) {
        return { success: false, error: titleValidation.error! }
      }
      updates.title = titleValidation.value
    }

    // 4. Update Firestore
    await projectRef.update(updates)

    // 5. Revalidate
    revalidatePath(`/menu/${projectId}`)
    revalidatePath('/dashboard')
    revalidateTag('projects', 'max')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: '프로젝트 수정에 실패했습니다.' }
  }
}

/**
 * Delete Project - Server Action
 */
export async function deleteProject(
  projectId: string
): Promise<ActionResult<void>> {
  try {
    // 1. Authentication
    const user = await getAuthenticatedUser()
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    // 2. Check ownership
    const db = getAdminDb()
    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(projectId)
    const projectDoc = await projectRef.get()

    if (!projectDoc.exists) {
      return { success: false, error: '프로젝트를 찾을 수 없습니다.' }
    }

    const projectData = projectDoc.data()!
    if (projectData.authorId !== user.uid) {
      return { success: false, error: '권한이 없습니다.' }
    }

    // 3. Delete with batch (cascade delete)
    const batch = db.batch()

    // Delete comments
    const commentsSnapshot = await db
      .collection(COLLECTIONS.COMMENTS)
      .where('projectId', '==', projectId)
      .get()
    commentsSnapshot.docs.forEach(doc => batch.delete(doc.ref))

    // Delete likes
    const likesSnapshot = await db
      .collection(COLLECTIONS.LIKES)
      .where('projectId', '==', projectId)
      .get()
    likesSnapshot.docs.forEach(doc => batch.delete(doc.ref))

    // Delete project
    batch.delete(projectRef)

    await batch.commit()

    // 4. Revalidate
    revalidatePath('/dashboard')
    revalidateTag('projects', 'max')

    return { success: true, data: undefined }
  } catch (error) {
    console.error('Error deleting project:', error)
    return { success: false, error: '프로젝트 삭제에 실패했습니다.' }
  }
}

/**
 * Like/Unlike Project - Server Action
 *
 * Optimistic UI 예제:
 * ```tsx
 * const [isPending, startTransition] = useTransition()
 *
 * function handleLike() {
 *   startTransition(async () => {
 *     await toggleLike(projectId)
 *   })
 * }
 * ```
 */
export async function toggleLike(
  projectId: string
): Promise<ActionResult<{ liked: boolean; newCount: number }>> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) {
      return { success: false, error: '로그인이 필요합니다.' }
    }

    const db = getAdminDb()
    const likesRef = db.collection(COLLECTIONS.LIKES)
    const existingLike = await likesRef
      .where('userId', '==', user.uid)
      .where('projectId', '==', projectId)
      .limit(1)
      .get()

    const projectRef = db.collection(COLLECTIONS.PROJECTS).doc(projectId)

    if (existingLike.empty) {
      // Add like
      await likesRef.add({
        userId: user.uid,
        projectId,
        createdAt: Timestamp.now(),
      })

      await projectRef.update({
        likes: (await projectRef.get()).data()!.likes + 1,
      })

      const updatedProject = await projectRef.get()
      const newCount = updatedProject.data()!.likes

      revalidatePath(`/menu/${projectId}`)
      revalidateTag('projects', 'max')

      return { success: true, data: { liked: true, newCount } }
    } else {
      // Remove like
      await existingLike.docs[0].ref.delete()

      await projectRef.update({
        likes: (await projectRef.get()).data()!.likes - 1,
      })

      const updatedProject = await projectRef.get()
      const newCount = updatedProject.data()!.likes

      revalidatePath(`/menu/${projectId}`)
      revalidateTag('projects', 'max')

      return { success: true, data: { liked: false, newCount } }
    }
  } catch (error) {
    console.error('Error toggling like:', error)
    return { success: false, error: '좋아요 처리에 실패했습니다.' }
  }
}
